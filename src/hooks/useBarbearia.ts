import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, servicesService, Service, BusinessHour, BarbershopSettings, BusinessBreak } from "@/services/barbearia";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { toast } from "sonner";

export function useBarbershopSettings() {
  const queryClient = useQueryClient();
  const { currentBarbershop } = useCurrentBarbershop();

  const query = useQuery({
    queryKey: ["barbershop-settings", currentBarbershop?.id],
    queryFn: () => settingsService.getSettings(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const mutation = useMutation({
    mutationFn: (settings: Partial<BarbershopSettings>) => 
      settingsService.updateBarbershopSettings({ id: currentBarbershop!.id, settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbershop-settings", currentBarbershop?.id] });
      // Invalidate current-barbershop and also refetch manually to ensure Context update
      queryClient.invalidateQueries({ queryKey: ["current-barbershop"] });
      window.dispatchEvent(new CustomEvent('barbershop-updated'));
      toast.success("Configurações salvas com sucesso.");
    },
    onError: (error: any) => {
      console.error('Erro ao salvar:', error);
      const message = error.message || "Erro ao salvar configurações.";
      toast.error(message);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file, currentBarbershop!.id),
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível carregar a logo.");
    }
  });

  const removeLogoMutation = useMutation({
    mutationFn: (url: string) => settingsService.removeLogo(url),
  });

  return { 
    ...query, 
    updateSettings: mutation.mutate,
    uploadLogo: uploadLogoMutation.mutateAsync,
    isUploadingLogo: uploadLogoMutation.isPending,
    removeLogo: removeLogoMutation.mutateAsync
  };
}

export function useBusinessHours() {
  const queryClient = useQueryClient();
  const { currentBarbershop } = useCurrentBarbershop();

  const query = useQuery({
    queryKey: ["business-hours", currentBarbershop?.id],
    queryFn: () => settingsService.getBusinessHours(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const mutation = useMutation({
    mutationFn: ({ id, hour }: { id: string; hour: Partial<BusinessHour> }) =>
      settingsService.updateBusinessHour(id, hour),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Horário atualizado com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar horário.");
    },
  });

  return { ...query, updateBusinessHour: mutation.mutate };
}

export function useBusinessBreaks() {
  const queryClient = useQueryClient();
  const { currentBarbershop } = useCurrentBarbershop();

  const query = useQuery({
    queryKey: ["business-breaks", currentBarbershop?.id],
    queryFn: () => settingsService.getBusinessBreaks(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: settingsService.createBusinessBreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-breaks"] });
      toast.success("Intervalo adicionado com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao adicionar intervalo.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, brk }: { id: string; brk: Partial<BusinessBreak> }) =>
      settingsService.updateBusinessBreak(id, brk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-breaks"] });
      toast.success("Intervalo atualizado com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar intervalo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: settingsService.deleteBusinessBreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-breaks"] });
      toast.success("Intervalo removido com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao remover intervalo.");
    },
  });

  return {
    ...query,
    createBreak: createMutation.mutate,
    createBreakAsync: createMutation.mutateAsync,
    updateBreak: updateMutation.mutate,
    updateBreakAsync: updateMutation.mutateAsync,
    deleteBreak: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useServices() {
  const queryClient = useQueryClient();
  const { currentBarbershop } = useCurrentBarbershop();

  const query = useQuery({
    queryKey: ["services", currentBarbershop?.id],
    queryFn: () => servicesService.getServices(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: servicesService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço cadastrado com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar serviço.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, service }: { id: string; service: Partial<Service> }) =>
      servicesService.updateService(id, service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar serviço.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servicesService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço excluído com sucesso.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao excluir serviço.");
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ serviceId, file }: { serviceId: string; file: File }) => 
      settingsService.uploadServiceImage(file, currentBarbershop!.id),
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível enviar a imagem.");
    }
  });

  const removeImageMutation = useMutation({
    mutationFn: (url: string) => settingsService.removeServiceImage(url),
  });

  return {
    ...query,
    createService: createMutation.mutate,
    updateService: updateMutation.mutate,
    deleteService: deleteMutation.mutate,
    uploadImage: uploadImageMutation.mutateAsync,
    isUploadingImage: uploadImageMutation.isPending,
    removeImage: removeImageMutation.mutateAsync,
  };
}

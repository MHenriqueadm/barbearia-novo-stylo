import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsService, Professional, ProfessionalService, ProfessionalSchedule, ProfessionalBreak, ProfessionalBlock } from "@/services/professionals";
import { settingsService } from "@/services/barbearia";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { toast } from "sonner";

export function useProfessionals() {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professionals", currentBarbershop?.id],
    queryFn: () => professionalsService.getProfessionals(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: (professional: any) => 
      professionalsService.createProfessional(professional),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals", currentBarbershop?.id] });
      toast.success("Profissional cadastrado com sucesso.");
    },
    onError: () => toast.error("Erro ao cadastrar profissional."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, professional }: { id: string; professional: any }) =>
      professionalsService.updateProfessional(id, professional),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals", currentBarbershop?.id] });
      toast.success("Profissional atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar profissional."),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const avatarUrl = await settingsService.uploadProfessionalAvatar(file, currentBarbershop!.id);
      await professionalsService.updateProfessional(id, { avatar_url: avatarUrl });
      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals", currentBarbershop?.id] });
      toast.success("Foto do profissional atualizada.");
    },
    onError: () => toast.error("Erro ao enviar foto."),
  });

  return {
    professionals: query.data || [],
    isLoading: query.isLoading,
    createProfessional: createMutation.mutateAsync,
    updateProfessional: updateMutation.mutateAsync,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
}

export function useProfessionalServices(professionalId: string) {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professional-services", professionalId, currentBarbershop?.id],
    queryFn: () => professionalsService.getProfessionalServices(professionalId),
    enabled: !!professionalId && !!currentBarbershop?.id,
  });

  const setServicesMutation = useMutation({
    mutationFn: (serviceIds: string[]) => 
      professionalsService.setProfessionalServices(professionalId, serviceIds, currentBarbershop!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services", professionalId] });
      toast.success("Serviços atualizados.");
    }
  });

  return {
    ...query,
    setProfessionalServices: setServicesMutation.mutateAsync
  };
}

export function useProfessionalSchedule(professionalId: string) {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professional-schedule", professionalId, currentBarbershop?.id],
    queryFn: () => professionalsService.getProfessionalSchedule(professionalId),
    enabled: !!professionalId && !!currentBarbershop?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ weekday, schedule }: { weekday: number, schedule: any }) =>
      professionalsService.updateProfessionalSchedule(professionalId, weekday, schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-schedule", professionalId] });
      toast.success("Escala atualizada.");
    },
  });

  return {
    ...query,
    updateSchedule: updateMutation.mutateAsync,
  };
}

export function useProfessionalBreaks(professionalId: string) {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professional-breaks", professionalId, currentBarbershop?.id],
    queryFn: () => professionalsService.getProfessionalBreaks(professionalId),
    enabled: !!professionalId && !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: (brk: any) =>
      professionalsService.createProfessionalBreak(brk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-breaks", professionalId] });
      toast.success("Intervalo adicionado.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, brk }: { id: string, brk: any }) =>
      professionalsService.updateProfessionalBreak(id, brk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-breaks", professionalId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalsService.deleteProfessionalBreak(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-breaks", professionalId] });
      toast.success("Intervalo removido.");
    },
  });

  return {
    breaks: query.data || [],
    isLoading: query.isLoading,
    createBreak: createMutation.mutateAsync,
    updateBreak: updateMutation.mutateAsync,
    deleteBreak: deleteMutation.mutateAsync,
  };
}

export function useProfessionalBlocks(professionalId: string) {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["professional-blocks", professionalId, currentBarbershop?.id],
    queryFn: () => professionalsService.getProfessionalBlocks(professionalId),
    enabled: !!professionalId && !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: (block: any) =>
      professionalsService.createProfessionalBlock(block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-blocks", professionalId] });
      toast.success("Bloqueio adicionado.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: professionalsService.deleteProfessionalBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-blocks", professionalId] });
      toast.success("Bloqueio removido.");
    },
  });

  return {
    ...query,
    createBlock: createMutation.mutateAsync,
    deleteBlock: deleteMutation.mutateAsync,
  };
}

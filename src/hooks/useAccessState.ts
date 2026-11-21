import { useAuth } from "@/hooks/useAuth";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useLocation } from "@tanstack/react-router";

export type AccessState = 
  | 'AUTH_LOADING' 
  | 'UNAUTHENTICATED' 
  | 'AUTHENTICATED_NO_BARBERSHOP' 
  | 'AUTHENTICATED_WITH_BARBERSHOP';

export function useAccessState() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentBarbershop, isLoading: shopLoading } = useCurrentBarbershop();
  const location = useLocation();

  let state: AccessState;

  if (authLoading || (isAuthenticated && shopLoading)) {
    state = 'AUTH_LOADING';
  } else if (!isAuthenticated) {
    state = 'UNAUTHENTICATED';
  } else if (!currentBarbershop) {
    state = 'AUTHENTICATED_NO_BARBERSHOP';
  } else {
    state = 'AUTHENTICATED_WITH_BARBERSHOP';
  }

  console.log(`[ACCESS] route=${location.pathname} authLoading=${authLoading} shopLoading=${shopLoading} isAuthenticated=${isAuthenticated} hasShop=${!!currentBarbershop} decision=${state}`);

  return {
    state,
    isLoading: state === 'AUTH_LOADING',
    isAuthenticated,
    currentBarbershop,
  };
}

import { createContext, useContext } from 'react';

const TransitionStatusContext = createContext<boolean>(false);

export const TransitionStatusProvider = TransitionStatusContext.Provider;

export const useTransitionStatus = () => useContext(TransitionStatusContext);

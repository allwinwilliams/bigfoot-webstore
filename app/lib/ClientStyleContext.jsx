import React from 'react';

const defaultContextValue = {
  reset: () => {}
};

const ClientStyleContext = React.createContext(defaultContextValue);

export default ClientStyleContext;

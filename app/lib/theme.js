import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const theme = createTheme({
  palette: {
      primary: {
        main: '#556cd6', // example color
      },
      secondary: {
        main: '#19857b', // example color
      },
      error: {
        main: red.A400,
      },
  },
  typography: {
    button: {
      textTransform: 'none',
      fontWeight: '600',
      fontSize: 16
    }
  }
});

export default theme;
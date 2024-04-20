import { 
    Button,
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    TextField,
    useMediaQuery,
    useTheme } 
  from '@mui/material';
  
function ProductSongSelector({ key, value, to, state }) {
    const [songId, setSongId] = useState(value); // Now songId is a state variable
    const [inputValue, setInputValue] = useState(value);
    const [open, setOpen] = useState(false);
  
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
  
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
    const handleSubmit = () => {
      console.log("Submit:", inputValue);
      setSongId(inputValue);
      handleClose();
    };
  
    return (
      <div className="product-options" key={key}>
        <div className="product-options-grid">
          <Button
            variant="outlined"
            onClick={handleOpen}
            fullWidth
            endIcon={<EditIcon />}
          >
            {songId === "" ? "Select a song" : songId}
          </Button>
  
          <Dialog
            fullScreen={fullScreen}
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
          >
          <DialogTitle>Select a Song</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              id="song-name"
              name="properties[Song Name]"
              variant="outlined"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              required
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
        </div>
      </div>
    );
  }
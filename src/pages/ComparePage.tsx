import { Box, Typography, Paper } from '@mui/material';

const ComparePage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        MIDI Comparison
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          MIDI comparison interface will be implemented in Phase 4.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ComparePage;

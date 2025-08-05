import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import MusicNoteIcon from '@mui/icons-material/MusicNote'

const Header = () => {
  const location = useLocation()

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Transcribe', path: '/transcribe' },
    { label: 'Compare', path: '/compare' },
  ]

  return (
    <AppBar position="static">
      <Toolbar>
        <MusicNoteIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AMT UI
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              color="inherit"
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header 
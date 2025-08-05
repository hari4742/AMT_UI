import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Slider,
  Typography,
  Button,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  Speed,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setPlaying,
  setCurrentTime,
  setPlaybackSpeed,
} from '@/store/slices/playbackSlice';

interface PlaybackControlsProps {
  duration: number;
  onSeek?: (time: number) => void;
  onPlayPause?: (playing: boolean) => void;
  onSpeedChange?: (speed: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  showZoomControls?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  duration,
  onSeek,
  onPlayPause,
  onSpeedChange,
  onZoomIn,
  onZoomOut,
  showZoomControls = false,
}) => {
  const dispatch = useAppDispatch();
  const { isPlaying, currentTime, playbackSpeed } = useAppSelector(
    (state) => state.playback
  );

  const [showSpeedDial, setShowSpeedDial] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback(() => {
    const newPlayingState = !isPlaying;
    dispatch(setPlaying(newPlayingState));
    onPlayPause?.(newPlayingState);
  }, [isPlaying, dispatch, onPlayPause]);

  const handleSeek = useCallback(
    (event: Event, value: number | number[]) => {
      const time = Array.isArray(value) ? value[0] : value;
      dispatch(setCurrentTime(time));
      onSeek?.(time);
    },
    [dispatch, onSeek]
  );

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    dispatch(setCurrentTime(newTime));
    onSeek?.(newTime);
  }, [currentTime, dispatch, onSeek]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    dispatch(setCurrentTime(newTime));
    onSeek?.(newTime);
  }, [currentTime, duration, dispatch, onSeek]);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      dispatch(setPlaybackSpeed(speed));
      onSpeedChange?.(speed);
      setShowSpeedDial(false);
    },
    [dispatch, onSpeedChange]
  );

  const speedOptions = [
    { icon: <Speed />, name: '0.5x', value: 0.5 },
    { icon: <Speed />, name: '0.75x', value: 0.75 },
    { icon: <Speed />, name: '1x', value: 1 },
    { icon: <Speed />, name: '1.25x', value: 1.25 },
    { icon: <Speed />, name: '1.5x', value: 1.5 },
    { icon: <Speed />, name: '2x', value: 2 },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {/* Play/Pause Button */}
        <IconButton
          onClick={handlePlayPause}
          size="large"
          color="primary"
          sx={{ width: 56, height: 56 }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>

        {/* Skip Controls */}
        <IconButton onClick={handleSkipBackward} size="medium">
          <SkipPrevious />
        </IconButton>
        <IconButton onClick={handleSkipForward} size="medium">
          <SkipNext />
        </IconButton>

        {/* Time Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Speed Control */}
        <Box sx={{ ml: 'auto', position: 'relative' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowSpeedDial(!showSpeedDial)}
            startIcon={<Speed />}
          >
            {playbackSpeed}x
          </Button>

          {showSpeedDial && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                mt: 1,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                zIndex: 1000,
                minWidth: 120,
              }}
            >
              {speedOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    playbackSpeed === option.value ? 'contained' : 'text'
                  }
                  size="small"
                  fullWidth
                  onClick={() => handleSpeedChange(option.value)}
                  sx={{ mb: 0.5, justifyContent: 'flex-start' }}
                >
                  {option.name}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Zoom Controls */}
        {showZoomControls && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={onZoomOut} size="small">
              <ZoomOut />
            </IconButton>
            <IconButton onClick={onZoomIn} size="small">
              <ZoomIn />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Timeline Slider */}
      <Box sx={{ px: 1 }}>
        <Slider
          value={currentTime}
          onChange={handleSeek}
          min={0}
          max={duration}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTime}
          sx={{
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
            },
            '& .MuiSlider-track': {
              height: 4,
            },
            '& .MuiSlider-rail': {
              height: 4,
            },
          }}
        />
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            width: '100%',
            height: 4,
            bgcolor: 'grey.200',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${(currentTime / duration) * 100}%`,
              height: '100%',
              bgcolor: 'primary.main',
              transition: 'width 0.1s ease',
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default PlaybackControls;

import { useState, useRef } from 'react';
import './VideoPlayer.css';

function VideoPlayer({ videoUrl, videoId, onProcess }) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePlay = () => {
        if (videoRef.current) {
            // Set playback speed to 0.8x (slower) before playing
            videoRef.current.playbackRate = 0.8;
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            // Set playback speed to 0.8x (slower)
            videoRef.current.playbackRate = 0.8;
            setIsLoading(false);
        }
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
        }
    };

    const handleError = () => {
        setError('Failed to load video');
        setIsLoading(false);
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!videoUrl) {
        return (
            <div className="video-player-empty">
                <div className="empty-content">
                    <span className="empty-icon">📹</span>
                    <p className="empty-message">No processed video available</p>
                    <p className="empty-hint">Process a video to see the heatmap overlay visualization</p>
                    {onProcess && (
                        <button className="btn btn-primary" onClick={onProcess}>
                            Process Video
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="video-player">
            <div className="video-container">
                {isLoading && (
                    <div className="video-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading video...</p>
                    </div>
                )}

                {error && (
                    <div className="video-error">
                        <span className="error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                <video
                    key={videoUrl}
                    ref={videoRef}
                    src={videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={handleError}
                    onPlay={() => {
                        setIsPlaying(true);
                        // Ensure playback rate is set to 0.8x
                        if (videoRef.current) {
                            videoRef.current.playbackRate = 0.8;
                        }
                    }}
                    onPause={() => setIsPlaying(false)}
                    onLoadStart={() => setIsLoading(true)}
                    className="video-element"
                />

                <div className="video-overlay">
                    {!isPlaying && !isLoading && !error && (
                        <button className="play-button-large" onClick={handlePlay}>
                            ▶️
                        </button>
                    )}
                </div>
            </div>

            <div className="video-controls">
                <button
                    className="btn btn-icon control-btn"
                    onClick={isPlaying ? handlePause : handlePlay}
                >
                    {isPlaying ? '⏸️' : '▶️'}
                </button>

                <div className="progress-container">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="progress-slider"
                    />
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="time-display">
                    <span>{formatTime(currentTime)}</span>
                    <span className="time-separator">/</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {videoId && (
                <div className="video-info">
                    <span className="video-id">📁 {videoId}</span>
                </div>
            )}
        </div>
    );
}

export default VideoPlayer;

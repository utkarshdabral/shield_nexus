/**
 * API endpoint to get list of processed videos
 */
import express from 'express';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Get list of processed videos
router.get('/processed', async (req, res) => {
    try {
        const processedDir = join(__dirname, '../../uploads/processed');

        // Check if directory exists
        try {
            await fs.access(processedDir);
        } catch {
            return res.json({ success: true, data: [] });
        }

        const files = await fs.readdir(processedDir, { withFileTypes: true });

        const videos = await Promise.all(
            files
                .filter(f => f.isFile() && /\.(mp4|webm)$/i.test(f.name))
                .map(async (f) => {
                    const stats = await fs.stat(join(processedDir, f.name));
                    const videoId = f.name.replace(/_processed\.(mp4|webm)$/i, '');
                    return {
                        videoId,
                        filename: f.name,
                        url: `/uploads/processed/${f.name}`,
                        size: stats.size,
                        createdAt: stats.birthtime.toISOString()
                    };
                })
        );

        res.json({
            success: true,
            count: videos.length,
            data: videos.sort((a, b) => a.videoId.localeCompare(b.videoId))
        });
    } catch (error) {
        console.error('Error listing processed videos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
    }
});

router.post('/', async(req, res) => {
    try {
        const count = await Project.countDocuments();
        const customId = req.body.customId || `proj-${count + 1}`;
        const newProject = new Project({
            ...req.body,
            customId
        });
        const saved = await newProject.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create project', details: err.message });
    }
});

router.delete('/:id', async(req, res) => {
    try {
        const { id } = req.params;
        await Project.findOneAndDelete({
            $or: [{ customId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
        });
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project', details: err.message });
    }
});

export default router;
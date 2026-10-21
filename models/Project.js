import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    customId: { type: String, unique: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    contractor: { type: String, required: true },
    region: { type: String, enum: ['Metro Manila', 'Luzon', 'Visayas', 'Mindanao'], default: 'Metro Manila', required: true },
    summary: { type: String, required: true },
    image: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
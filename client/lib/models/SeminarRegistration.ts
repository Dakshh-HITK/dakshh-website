import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const seminarRegistrationSchema = new Schema({
    seminarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seminar",
        required: true,
    },
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, {
    collection: "SeminarRegistration",
    timestamps: true,
});

const SeminarRegistration = models.SeminarRegistration || model("SeminarRegistration", seminarRegistrationSchema);
export default SeminarRegistration;
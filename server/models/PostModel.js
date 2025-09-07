import mongoose from "mongoose";



const fileSchema = new mongoose.Schema({

name: { type: String },

type: { type: String },

url: { type: String },

}, { _id: false });



const postSchema = new mongoose.Schema({

content: { type: String, required: true },

files: [fileSchema],

location: { type: String },

severityPrediction: { type: Boolean }, // will be predicted by model

disasterName: { type: String }, // will be predicted by model

user: {

type: mongoose.Schema.Types.ObjectId,

ref: "User",

required: false,

},

}, { timestamps: true });



export default mongoose.model("Post", postSchema);
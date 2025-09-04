import gradio as gr
from fastai.vision.all import load_learner, PILImage
from fastai.text.all import load_learner as load_text_learner

# Load trained learners
image_learner = load_learner("image_disaster.pkl")
text_learner = load_text_learner("text_disaster.pkl")

# Image prediction function
def predict_image(img):
    pred,pred_idx,probs = image_learner.predict(PILImage.create(img))
    return f"Predicted category: {pred} ({probs[pred_idx]*100:.2f}%)"

# Text prediction function
def predict_text(tweet):
    pred,pred_idx,probs = text_learner.predict(tweet)
    return f"Predicted category: {pred} ({probs[pred_idx]*100:.2f}%)"

# Gradio interface
with gr.Blocks() as demo:
    gr.Markdown("## Disaster Prediction")
    
    with gr.Tab("Image"):
        img_input = gr.Image(type="filepath")
        img_output = gr.Textbox()
        img_btn = gr.Button("Predict")
        img_btn.click(predict_image, inputs=img_input, outputs=img_output)
    
    with gr.Tab("Tweet"):
        txt_input = gr.Textbox(label="Enter tweet text")
        txt_output = gr.Textbox()
        txt_btn = gr.Button("Predict")
        txt_btn.click(predict_text, inputs=txt_input, outputs=txt_output)

demo.launch()

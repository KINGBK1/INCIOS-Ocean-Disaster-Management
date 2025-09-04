from fastai.vision.all import *
from fastai.text.all import *
import pandas as pd
from google.colab import files
import glob
import kagglehub
import os
from pathlib import Path

img_path1 = Path("/kaggle/input/disaster-images-dataset")
img_path2 = Path("/kaggle/input/nlp-with-disaster-tweets-cleaning-data")

def make_image_df(base_path):
    items = get_image_files(base_path)  # finds all images
    return pd.DataFrame({
        "image_path": [str(f) for f in items],
        "label": [f.parent.name for f in items]  # label = folder name
    })

df_img1 = make_image_df(img_path1)
df_img2 = make_image_df(img_path2)
image_df = pd.concat([df_img1, df_img2], ignore_index=True)

print("Please upload your CSV files (6 in total)")
uploaded = files.upload()

# Read all uploaded CSVs into pandas DataFrames
csv_dataframes = {}
for filename in uploaded.keys():
    csv_dataframes[filename] = pd.read_csv(filename)
    print(f"{filename} -> Shape: {csv_dataframes[filename].shape}")

# Example: access one CSV
df1 = csv_dataframes[list(csv_dataframes.keys())[0]]
df1.head()

# Load CSVs
df1 = pd.read_csv("tweets.csv")
df2 = pd.read_csv("natural_disasters_2024.csv")
df3 = pd.read_csv("final_dataset_mini_balanced.csv")
df4 = pd.read_csv("disaster_response_messages_test.csv")
df5 = pd.read_csv("disaster_categories.csv")
df6 = pd.read_csv("2011Tornado_Summary.csv")

# ---- Standardize columns ----
datasets = []

# tweets.csv
if 'text' in df1.columns:
    datasets.append(df1.rename(columns={'text': 'text', 'target': 'label'})[['text','label']])

# natural_disasters_2024.csv
if 'disaster_type' in df2.columns and 'description' in df2.columns:
    datasets.append(df2.rename(columns={'description': 'text', 'disaster_type': 'label'})[['text','label']])

# final_dataset_mini_balanced.csv
if 'text' in df3.columns and 'label' in df3.columns:
    datasets.append(df3[['text','label']])

# disaster_response_messages_test.csv
if 'message' in df4.columns:
    datasets.append(df4.rename(columns={'message': 'text'})[['text']])  # may not have labels

# disaster_categories.csv
if 'category' in df5.columns and 'message' in df5.columns:
    datasets.append(df5.rename(columns={'message':'text','category':'label'})[['text','label']])

# 2011Tornado_Summary.csv
if 'Summary' in df6.columns:
    df6['label'] = 'tornado'  # fixed label
    datasets.append(df6.rename(columns={'Summary':'text'})[['text','label']])

# ---- Merge all ----
merged_df = pd.concat(datasets, ignore_index=True)

print("Final merged dataset shape:", merged_df.shape)
print(merged_df.head())

# Drop rows with missing labels
merged_df = merged_df.dropna(subset=["label"])
image_df = image_df.dropna(subset=["label"])

# Reset index (important for DataBlock)
merged_df = merged_df.reset_index(drop=True)
image_df = image_df.reset_index(drop=True)

print("Text dataset shape:", merged_df.shape)
print("Image dataset shape:", image_df.shape)


# ---- Image DataBlock ----
image_dblock = DataBlock(
    blocks=(ImageBlock, CategoryBlock),
    get_x=ColReader('image_path'),
    get_y=ColReader('label'),
    splitter=RandomSplitter(0.2, seed=42),
    item_tfms=Resize(150) # Add this line to resize images
)

image_dls = image_dblock.dataloaders(image_df, bs=32)
image_dls.show_batch(max_n=6)

# ---- Text DataBlock ----
text_dblock = DataBlock(
    blocks=(TextBlock.from_df('text', seq_len=72), CategoryBlock),
    get_x=ColReader('text'),
    get_y=ColReader('label'),
    splitter=RandomSplitter(0.2, seed=42)
)

text_dls = text_dblock.dataloaders(merged_df, bs=32)
text_dls.show_batch(max_n=6)

# OUTPUT
# xxbos xxmaj just had a great workout ! xxmaj feeling energized and ready to tackle the day ahead . # fitness # healthy # motivation , 2 . xxmaj just started a new job . xxmaj the first day was nerve - wracking but also exciting . xxmaj ca n't wait to see where this journey takes me . # career # jobsearch , 3 . xxmaj had a great time catching up with old friends last night . xxmaj it 's always nice to reminisce about old times . # friendship # nostalgia , 4 . xxmaj looked outside and saw snowfall ! xxmaj it 's the perfect way to start the winter season . # winter # snow , 5 . xxmaj trying to balance work and school . xxmaj it 's not always easy , but xxmaj i 'm making it work . # studentlife # productivity	Non-Disaster
# 1	xxbos i could n't imagine going to work and never coming back . xxmaj that 's what happened to the workers in the industrial accident in the factory down the road . xxmaj it 's time for our society to take responsibility for ensuring that worker safety is taken seriously . # industrialaccident # workers # safety # workplace # protecttheworkforce https : / / xxrep 3 w .google.com / amp / s / xxrep 3 w xxunk - xxunk / article / current - affairs / xxunk # amp	Industrial Accident
# 2	xxbos " this flood has affected so many families and businesses in my community . xxmaj the water has caused a lot of damage , and many people have lost everything . xxmaj it 's a reminder of the power of nature , and it 's important that we take steps to protect ourselves from its wrath . "	Flood
# 3	xxbos " a wildfire has ripped through my village in xxmaj india . xxmaj the flames are devastating everything in their path . xxmaj it 's hard to comprehend the scale of the disaster . xxmaj but we 're also grateful for the firefighters who are bravely battling the flames . # wildfire # india # grateful "	Wildfire
# 4	xxbos " the authorities have closed all bridges and roads in my city due to the risk of flooding . xxmaj people are being advised to stay indoors and away from flooded areas . xxmaj i 'm hoping for the best and that the flood does n't get worse . 🙏 ❤ ️ # xxmaj flood "	Flood
# 5	xxbos " just saw a video of a river turning into a xxunk of water due to the flood . xxmaj it 's a terrifying sight and it looks like it 's only going to get worse . xxmaj i 'm sending prayers to those affected . 🙏 ❤ ️ # xxmaj flood "	Flood


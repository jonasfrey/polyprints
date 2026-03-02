#generate image from text 
response=$(curl --request POST \
  --url https://queue.fal.run/fal-ai/nano-banana-2 \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater."
   }')
REQUEST_ID=$(echo "$response" | grep -o '"request_id": *"[^"]*"' | sed 's/"request_id": *//; s/"//g')


# generate 3d model from image 
response=$(curl --request POST \
  --url https://queue.fal.run/fal-ai/hunyuan3d-v21 \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "input_image_url": "https://storage.googleapis.com/falserverless/model_tests/video_models/robot.png"
   }')
REQUEST_ID=$(echo "$response" | grep -o '"request_id": *"[^"]*"' | sed 's/"request_id": *//; s/"//g')
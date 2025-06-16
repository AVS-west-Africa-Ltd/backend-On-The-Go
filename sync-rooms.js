const axios = require("axios");
const FormData = require("form-data");

// Config
const SOURCE_URL = "http://api-dev.onthegoafrica.com/api/v1/chat/rooms";
const TARGET_URL = "http://192.168.0.135:5002/api/v1/chat/room/create";
const API_KEY = "26a3281bfc65b39527447691941d6a707357a1278b1b2ec91742faec9de53ac8";
const FORCED_CREATOR_ID = 3;

(async () => {
  try {
    console.log("🟡 Fetching rooms from dev API...");

    const { data: sourceResponse } = await axios.get(SOURCE_URL, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    if (!sourceResponse.success || !Array.isArray(sourceResponse.data)) {
      throw new Error("Invalid response from source API");
    }

    const roomsToUpload = sourceResponse.data.filter(
      (room) => room.type === "group" && room.name
    );

    console.log(`🟢 Found ${roomsToUpload.length} group rooms to upload.`);

    for (const [index, room] of roomsToUpload.entries()) {
      console.log(`\n🔄 [${index + 1}/${roomsToUpload.length}] Processing room: ${room.name} (ID: ${room.id})`);

      const form = new FormData();
      form.append("name", String(room.name));
      form.append("type", String(room.type));
      form.append("description", String(room.description || ""));
      form.append("status", String(room.status || "Private"));
      form.append("created_by", String(FORCED_CREATOR_ID));
      form.append("is_private_displayed", String(room.is_private_displayed || false));

      if (room.image_url) {
        console.log("📷 Fetching image...");
        try {
          const imgRes = await axios({
            method: 'get',
            url: room.image_url,
            responseType: 'stream'
          });

          const filename = `room_${room.id}.jpg`;
          const contentType = imgRes.headers['content-type'] || 'image/jpeg';

          form.append("image_url", imgRes.data, {
            filename,
            contentType
          });
          console.log("✅ Image added to form.");
        } catch (err) {
          console.warn(`⚠️  Failed to fetch image for "${room.name}". Continuing without image.`);
          console.warn(`Image fetch error: ${err.message}`);
        }
      } else {
        console.log("ℹ️  No image provided.");
      }

      try {
        console.log("🚀 Uploading room to live API...");

        const uploadRes = await axios({
          method: "post",
          url: TARGET_URL,
          data: form,
          headers: {
            ...form.getHeaders(),
            "x-api-key": API_KEY,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 30000,
        });

        if (uploadRes.data?.success) {
          console.log(`✅ Successfully uploaded room: ${room.name}`);
        } else {
          console.error(`❌ Upload failed for room: ${room.name}`);
          console.error("Server response:", uploadRes.data);
        }
      } catch (err) {
        console.error(`❌ Error during upload for "${room.name}": ${err.message}`);
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
      }
    }

    console.log("\n🎉 All done!");
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
  }
})();

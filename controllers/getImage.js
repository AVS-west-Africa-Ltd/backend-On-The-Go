const fs = require("fs");
const path = require("path");

const getImage = async (req, res) => {
  console.log("---");
  let filePath = path.join(
    __dirname,
    "../",
    req.url === "/" ? "index.html" : req.url
  );

  console.log(filePath);

  let contentType = "text/html";

  let mimeType = path.extname(filePath);

  switch (mimeType) {
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpg";
      break;
    case ".jpeg":
      contentType = "image/jpeg";
      break;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      console.log(error);
    }
    res.writeHead(200, { "Content-Type": contentType });
    return res.end(data, "utf8");
  });
};

module.exports = getImage;

// import cloudinary from "cloudinary";
// import multer from "multer";

// cloudinary.config({
//   cloud_name: "dwiisilga",
//   api_key: 924275739994991,
//   api_secret: "CAdmiGzr3ikfmP9NW1odC04fcLg",
// });

// const storage = multer.diskStorage({
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + file.originalname);
//   },
// });

// const imageFilter = function (req, file, cb) {
//   if (!file.originalname.match(/\.(jpeg|jpg|heic|jpg|bmp|png|zip|rar|)$/i)) {
//     return cb("Only image files or zip are allowed", false);
//   } else {
//     cb(null, true);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: imageFilter,
// });

// var storager = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Uploads is the Upload_folder_name
//     cb(null, "uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + "-" + Date.now());
//   },
// });
// const fileUploader = multer({ storage: storager });

// let databaseConnection = {
//   db_username: "otgadmin",
//   password: "abcd1234",
//   cluster: "cluster0.joqfv",
//   dbName: "Slammyphotography",
// };

export default {
  LOCAL_DATABASE: "mongodb://localhost:27017/onthego",
  // ONLINE_DATABASE: `mongodb+srv://${databaseConnection.db_username}:${databaseConnection.password}@${databaseConnection.cluster}.mongodb.net/${databaseConnection.dbName}?retryWrites=true&w=majority`,
  // LOGIN_SECRET: "diceyguysmiracleboy",
  // cloud_name: "dwiisilga",
  // api_key: 924275739994991,
  // api_secret: "CAdmiGzr3ikfmP9NW1odC04fcLg",
  // upload: upload,
  // fileUploader: fileUploader,
  nodemailerconfig: {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "everardo.bartoletti92@ethereal.email",
      pass: "QfYBTXUtmwzvSY3pAZ",
    },
  },
  BASE_URL: "http://localhost:9000",
};

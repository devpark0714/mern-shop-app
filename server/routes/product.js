const express = require('express');
const router = express.Router();
const multer = require('multer')

//=================================
//             Product
//=================================

// 2. 백엔드에서 multer를 이용해 파일 저장
var storage = multer.diskStorage({
    // 2. destination : 어디에 파일이 저장되는지 -> uploads 폴더
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    // 2. filname : uploads라는 폴더에 파일을 저장할 때 어떤 이름으로 저장할지
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`)
    }
  })
   
  var upload = multer({ storage: storage }).single("file")

router.post('/image', (req, res) => {

    // 2. 가져온 이미지를 저장을 해주면 된다.
    upload(req, res, err => {
        if (err) {
            return req.json({ success: false, err })
        }
        // 3. 백엔드에서 프론트로 파일저장 정보 전달
        return res.json({ success: true,
            filePath: res.req.file.path,
            fileName: res.req.file.filename})
    })
})


module.exports = router;
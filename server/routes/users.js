const express = require('express')
const router = express.Router()
const { User } = require("../models/User")
const { Product } = require('../models/Product')

const { auth } = require("../middleware/auth")

//=================================
//             User
//=================================

router.get("/auth", auth, (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image,
        cart: req.user.cart,
        history: req.user.history
    });
});

router.post("/register", (req, res) => {

    const user = new User(req.body);

    user.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).json({
            success: true
        });
    });
});

router.post("/login", (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (!user)
            return res.json({
                loginSuccess: false,
                message: "Auth failed, email not found"
            });

        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
                return res.json({ loginSuccess: false, message: "Wrong password" });

            user.generateToken((err, user) => {
                if (err) return res.status(400).send(err);
                res.cookie("w_authExp", user.tokenExp);
                res
                    .cookie("w_auth", user.token)
                    .status(200)
                    .json({
                        loginSuccess: true, userId: user._id
                    });
            });
        });
    });
});

router.get("/logout", auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { token: "", tokenExp: "" }, (err, doc) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).send({
            success: true
        });
    });
});

router.post("/addToCart", auth, (req, res) => {
    
    // 먼저 User Collection에 해당 유저의 정보를 가져오기
    // auth 미들웨어를 통과하면서 req.user 안에 user 정보가 담긴다
    User.findOne({ _id: req.user._id },
        (err, userInfo) => {

            // 가져온 정보에서 카트에다 넣으려 하는 상품이 이미 들어 있는지 확인
            let duplicate = false
            userInfo.cart.forEach((item) => {
                if (item.id === req.body.productId) {
                    duplicate = true
                }
            })

            // 상품이 이미 있을때 -> 상품 개수를 1개 올리기
            if (duplicate) {
                User.findOneAndUpdate(
                    { _id: req.user._id, "cart.id": req.body.productId },
                    { $inc: {"cart.$.quantity": 1} },
                    // 업데이트된 정보를 받기 위해 { new: true }를 사용
                    { new: true },
                    (err, userInfo) => {
                        if (err) return res.status(200).json({ success: false, err})
                        res.status(200).send(userInfo.cart)
                    }
                )
            }

            // 상품이 이미 있지 않을때 -> 필요한 상품 정보 상품 ID 개수 1, 날짜 정도 다 넣어줘야함
            else {
                User.findOneAndUpdate(
                    { _id: req.user._id },
                    {
                        $push: {
                            cart: {
                                id: req.body.productId,
                                quantity: 1,
                                date: Date.now()
                            }
                        }
                    },
                    { new: true },
                    (err, userInfo) => {
                        if (err) return res.status(400).json( {success: false, err })
                        res.status(200).send(userInfo.cart)
                    }
                )
            }   
        })
})

router.get('/removeFromCart', auth, (req, res) => {

    // **먼저 cart안에 내가 지우려고 한 상품을 지워주기** 
    User.findOneAndUpdate(
        { _id: req.user._id },
        {
            "$pull":
                { "cart": { "id": req.query.id } }
        },
        { new: true },
        (err, userInfo) => {
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })

            // **product collection에서  현재 남아있는 상품들의 정보를 가져오기**

            // productIds = ['5e8961794be6d81ce2b94752(2번째)', '5e8960d721e2ca1cb3e30de4(3번째)'] 이런식으로 바꿔주기
            Product.find({ _id: { $in: array } })
                .populate('writer')
                .exec((err, productInfo) => {
                    return res.status(200).json({
                        productInfo,
                        cart
                    })
                })
        }
    )
})

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require("../controller/userController")
const productController= require("../controller/productController")
const cartController = require("../controller/cartController")
const middleWare = require("../middleware/auth")

//===============================userapi============================================//
router.post("/register",userController.createUser)
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",middleWare.authentication,middleWare.authorization,userController.getuserprofile)
router.put("/user/:userId/profile",middleWare.authentication,middleWare.authorization,userController.updateUser)
//==============================productapi=============================================// 

router.post("/products",productController.createProduct )
router.get('/products', productController.getProductsByQuery)
router.get('/products/:productId', productController.getproduct)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteproduct)

//=======================================cart==========================================//
router.post("/users/:userId/cart", middleWare.authentication,middleWare.authorization, cartController.createCart)
router.put("/users/:userId/cart", middleWare.authentication,middleWare.authorization, cartController.updateCart)
router.get("/users/:userId/cart", middleWare.authentication,middleWare.authorization, cartController.getCart)
router.delete("/users/:userId/cart", middleWare.authentication,middleWare.authorization, cartController.deleteCart)

//==========================================order=============================================//
router.post("/users/:userId/orders",)
router.put("/users/:userId/orders",)

router.all("/*",(req,res)=>{
  res.status(400).send({status:false,message:"Endpoint is not correct"})})



module.exports = router;
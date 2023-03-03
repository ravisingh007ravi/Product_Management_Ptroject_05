const valid = require("../Validator/validator")
const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const UserModel = require("../models/userModel")

const createCart = async function (req,res) {
try {
    let userId =req.params.userId

    let data = req.body
    if(!valid.isValidRequestBody(data)){
        return res.status(400).send({status:false,msg:"Give valid Body",})
    }
    
    let {productId,quantity,cartId} = data
    const user = await UserModel.findById(userId)
    if (!user) {
        return res.status(404).send({ status: false, message: "No User found" });
    }
    if(!valid.isValidObjectId(productId)){
        return res.status(400).send({status:false,msg:"Give valid userID",})
    }
    const product = await productModel.findOne({ _id: productId, isDeleted: false });
    if(!product){
        return res.status(404).send({ status: false, message: "No product found"})
    }
    if(!quantity){
        quantity=1
    }
    if(typeof quantity != Number && quantity <=0 ){
        return res.status(400).send({ status: false, message: "Enter valid Quantity" })
    }
    const cart = await cartModel.findById(cartId)
    if(cart){
    let cartItem =cart.items
    let cartTotalPrice = cart.totalPrice
    // let cartTotalItem = cart.totalItems
    for(let i=0;i<cartItem.length;i++){
        if(cartItem[i].productId._id == productId){
            cartItem[i].quantity = cartItem[i].quantity + quantity
            cart.totalPrice = ((product.price)*quantity) + cartTotalPrice
            cart.save()
    return res.status(201).send({ status: true, message: "Success", data:cart })
}}
    
            cart.items.push({
            productId: productId,
            quantity: quantity
        })
        cart.totalItems= cartItem.length
         cart.totalPrice= ((product.price)*quantity) + cartTotalPrice
         await cart.save()
    return res.status(201).send({ status: true, message: "Success", data:cart })
}
     if(!cart){
        const itemAdded = {
            userId:userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: product.price * quantity,
            totalItems: 1,
            // cart.save()
        }  
    const newCart = await cartModel.create(itemAdded)
    return res.status(201).send({ status: true, message: "Success", data: newCart })
    
}
}catch (error) {
    return res.status(500).send({ status: false, message: error.message})
}}

const updateCart = async function(req,res) {
    try{
        const body = req.body
        const userId = req.params.userId;

        if(Object.keys(body) == 0){
            return res.status(400).send({ status: false, msg: "Please provide data to update."});
        }

        if(!valid.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }

        const userSearch = await UserModel.findById({_id:userId})
        if(!userSearch) {
            return res.status(400).send({status: false, msg: "userId does not exist"})
        }

        // if(userId !== req.userId) {
        //     return res.status(401).send({status: false, msg: "Unauthorised access"})
        // }

        const {cartId, productId, removeProduct} = body

        if(!valid.isValid(cartId)) {
            return res.status(400).send({status: false, msg: "CartId is required"})
        }

        if(!valid.isValidObjectId(cartId)) {
            return res.status(400).send({status: false, msg: "Invalid cartId"})
        }

        if(!valid.isValid(productId)) {
            return res.status(400).send({status: false, msg: "productId is required"})
        }

        if(!valid.isValidObjectId(productId)) {
            return res.status(400).send({status: false, msg: "Invalid productId"})
        }

        const cartSearch = await cartModel.findOne({_id: cartId})
        if(!cartSearch) {
            return res.status(404).send({status: false, msg: "Cart does not exist"})
        }

        const productSearch = await productModel.findOne({ _id: productId})
        if(!productSearch) {
            return res.status(404).send({status: false, msg: "product does not exist"})
        }

        if(productSearch.isDeleted == true) {
            return res.status(400).send({status: false, msg: "Product is already deleted"})
        }

        if((removeProduct != 0) && (removeProduct != 1)) {
            return res.status(400).send({status: false, msg: "Invalid remove product"})
        }


        const cart = cartSearch.items
        for(let i=0; i<cart.length; i++) {
            if(cart[i].productId == productId) {
                const priceChange = cart[i].quantity * productSearch.price
                if(removeProduct == 0) {
                    const productRemove = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {items:{productId: productId}}, totalPrice: cartSearch.totalPrice-priceChange, totalItems:cartSearch.totalItems-1}, {new:true})
                    return res.status(200).send({status: true, message: 'Success', data: productRemove})
                }

                if(removeProduct == 1) {
                    if(cart[i].quantity == 1 && removeProduct == 1) {
                     const priceUpdate = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {items: {productId: productId}}, totalPrice:cartSearch.totalPrice-priceChange, totalItems:cartSearch.totalItems-1}, {new: true})
                     return res.status(200).send({status: true, message: 'Success', data: priceUpdate})
                }

                cart[i].quantity = cart[i].quantity - 1
                const updatedCart = await cartModel.findByIdAndUpdate({_id: cartId}, {items: cart, totalPrice:cartSearch.totalPrice - productSearch.price}, {new: true})
                return res.status(200).send({status: true, message: 'Success', data: updatedCart})
                }
            }
           return res.status(400).send({ status: false, message: "Product does not found in the cart"})
        }
        
    }
    catch (error) {
        console.log("This is the error :", error.message)
        res.status(500).send({ msg: "Error", error: error.message })
    } 
}


const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        //if userId is given then is it valid or not
        if (userId) {
            if (!valid.isValidObjectId(userId))
                return res.status(400).send({ status: false, msg: "wrong userId" });
        }
        // finding user in DB 
        let checkUserId = await UserModel.findOne({ _id: userId });
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: "no user details found" });
        }
        // finding in cart 
        let getData = await cartModel.findOne({ userId });
        if (getData.items.length == 0)
            return res.status(400).send({ status: false, message: "items details not found" });
        //If not get
        if (!getData) {
            return res.status(404).send({ status: false, message: "cart not found" });
        }
        res.status(200).send({ status: true, message: "cart successfully", data: getData });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;

       
        if (!valid.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        const findUser = await UserModel.findOne({ _id: userId })
        if (!findUser) {
            return res.status(400).send({status: false,message: `User doesn't exists by ${userId} `})
        }

        
        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(400).send({status: false,message: `Cart doesn't exists by ${userId} `})
        }
        //not deleting the cart, just changing their value to 0.
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, {$set: {items: [],totalPrice: 0,totalItems: 0}},{new:true})
        return res.status(204).send()
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


module.exports = {createCart,updateCart,getCart,deleteCart}

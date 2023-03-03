const productModel = require("../models/productModel")
const aws = require("../AWS/aws")
const valid = require("../Validator/validator")

const createProduct = async function (req, res) {
    try {
        let data = req.body
        let file = req.files

        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: "please input some data" }) }
        let { title, description, price, currencyId, currencyFormat, availableSizes, installments } = data

        if (file && file.length > 0) {
            let image = await aws.uploadFile(file[0])
            data.productImage = image
        } else {
            return res.status(400).send({ status: false, message: "please provide the productImage" })
        }

        if (!title)
            return res.status(400).send({ status: false, message: "Title is mandatory" });
        if (!valid.isValidT(title)) {
            return res.status(400).send({ status: false, message: "title not in valid format." })
        }

        let duplicateTitle = await productModel.findOne({ title: title })
        if (duplicateTitle) {
            return res.status(400).send({ status: false, message: "title already exist" })
        }
        if (!description)
            return res.status(400).send({ status: false, message: "description is mandatory" });

        if (!price)
            return res.status(400).send({ status: false, message: "price is mandatory." });
        if (price) {
            if (!(valid.isValidPrice(price))) {
                return res.status(400).send({ status: false, message: "Invalid price" })
            }
        }
        if (!availableSizes)
            return res.status(400).send({ status: false, message: "availableSizes is mandatory." });
        let size1 = ["S", "XS", "M", "X", "L", "XXL", "XL"];
        let size2 = availableSizes
            .toUpperCase()
            .split(",")
            .map((x) => x.trim());
        for (let i = 0; i < size2.length; i++) {
            if (!size1.includes(size2[i])) {
                return res.status(400).send({ status: false, message: "Sizes should one of these - 'S', 'XS', 'M', 'X', 'L', 'XXL' and 'XL'", });
            }
        } data.availableSizes = size2

        if(currencyId){
            if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: "only indian currencyId INR accepted" })
        }
    }
        //currency format

    if(currencyFormat){  
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "only indian currency ₹ accepted " })
        }}
        //price validation

        if (installments) {
            if (!(valid.isValidI(installments))) {
                return res.status(400).send({ status: false, message: "Invalid installments" })
            }
        }
        //currency id

        data.currencyId = "INR"
        data.currenyFormat = "₹"

        //creation

        const created = await productModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: created })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}
//================================ getProductsByQuery ==============================================//
const getProductsByQuery = async function (req, res) {
    try {
        const queryParams = req.query
        //Extract params
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams

        const filterQuery = { isDeleted: false }
        // validation start
        if (size) {
            size = size.toUpperCase().split(",")
            if (!size) return res.status(400).send({ status: false, msg: "provide size" })
            for (let i = 0; i < size.length; i++) {

                if (!valid.isValidAvailableSizes(size[i])) {
                    return res.status(400).send({ status: false, msg: `Size should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }

            filterQuery['availableSizes'] = { $in: size }
        };

        if (priceGreaterThan) {
            if (!valid.isValidPrice(priceGreaterThan))
                return res.status(400).send({ status: false, msg: "provide priceGreaterThan in numeric" })
            filterQuery['price'] = { $gt: priceGreaterThan }
        };

        if (priceLessThan) {
            if (!valid.isValidPrice(priceLessThan))
                return res.status(400).send({ status: false, msg: "provide priceLessThan in numeric" })
            filterQuery['price'] = { $lt: priceLessThan }
        };

        if (valid.isValid(name)) {
            filterQuery['title'] = { $regex: name, $options: "i" };
        };

        // validation of priceSort
        if (priceSort) {
            if (!((priceSort == 1) || (priceSort == -1))) {
                return res.status(400).send({ status: false, message: "Price sort only takes 1 or -1 as a value" })
            }

            let filterProduct = await productModel.find(filterQuery).sort({ price: priceSort })
            if (Object.keys(filterProduct).length == 0) { return res.status(400).send({ status: false, message: "No products found with this query" }) }
            return res.status(200).send({ status: true, message: 'Success', data: filterProduct })
        }
        // validation end

        const products = await productModel.find(filterQuery).sort({ price: 1 })

        if (Object.keys(products).length == 0) { return res.status(400).send({ status: false, message: "Product not found" }) }
        return res.status(200).send({ status: true, message: "Success", data: products })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


const getproduct = async function (req, res) {
    try {
        const productId = req.params.productId;

        if (!valid.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: 'Params Id is invalid' })
        }

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(400).send({ status: false, message: 'Product not found' })
        }

        if (product.isDeleted) {
            return res.status(400).send({ status: false, message: 'This Product is deleted' })
        }

        res.status(200).send({ status: true, message: 'Success', data: product })

    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, Error: err.message })
    }
}

const updateProduct = async function (req, res) {
    try {
        let data = req.body;
        const productId = req.params.productId
        let files = req.files

        let { title, description, price, currencyId, currencyFormat, installments,availableSizes, isFreeShipping } = data

        const dataObject = {};


        if (!valid.isValidRequestBody(data) && !(req.files)) return res.status(400).send({ status: false, message: "plz enter the field which you want to update"});

        if (!(valid.isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: "productId is invalid" });
        }
       
        const findProduct = await productModel.findById(productId)

        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'product does not exists' })
        }

        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, message: "product is deleted" });
        }
        
        
    if(title){    
        if (!(valid.isValid(title))) {
            return res.status(400).send({status:false, message: "Please enter discription"})
        }
    
        let title1 = await productModel.findOne({title:title})
        if(title1) {
            return res.status(400).send({status:false, message: "title already exist in use"})
        }
        dataObject['title'] = title
    }

    if(description) {
        if (!(valid.isValid(description))) {
            return res.status(400).send({status:false, message: "Please enter discription"})
        }
            dataObject['description'] = description
    }    
        
    if(price){
        if (!(valid.isValid(price)))  {
            return res.status(400).send({status:false, message: "Please enter price"})
        }    
        if(price){
            if (!(valid.isValidPrice(price))) {
                return res.status(400).send({ status: false, message: "Invalid price" })
            }
        }  
            dataObject['price'] = price
    }  

    if (currencyId) {
        if (!(valid.isValid(currencyId))) return res.status(400).send({ status: false, message: "currencyId required" });
        if (currencyId != 'INR') return res.status(400).send({ status: false, message: "only indian currencyId INR accepted"});
        dataObject['currencyId'] = currencyId
            }    

    if (currencyFormat) {
        if (!(valid.isValid(currencyFormat))) return res.status(400).send({ status: false, message: "currency format required" });
        if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "only indian currency ₹ accepted"});
        dataObject['currencyFormat'] = currencyFormat
            }
        
        if (files && files.length > 0) {
            let validImage=files[0].mimetype.split('/')
            if(validImage[0]!="image"){
           return res.status(400).send({ status: false, message: "Please Provide Valid Image.." })}
            let uploadFileUrl = await aws.uploadFile(files[0])
            dataObject['productImage'] = uploadFileUrl
        }


 

        
        if (availableSizes) {
            if (!valid.isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: 'AvailableSizes is required' })
            }

            let array = availableSizes.split(",").map(x => x.toUpperCase().trim())
            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, message: 'Sizes only available from ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
                }
            
            if (Array.isArray(array)) {
                data.availableSizes = array
            }
        }
            dataObject["availableSizes"]= availableSizes 
    }   
        
        if (installments) {
            if (!(valid.isValidI(installments))) {
                return res.status(400).send({ status: false, message: "Invalid installments" })
            }
            dataObject["installments"]=installments
        }

        if(isFreeShipping) {
            if(valid.isValid(isFreeShipping)){
                dataObject["isFreeShipping"] = isFreeShipping
            }
        }

        let updatedProduct = await productModel.findOneAndUpdate({_id:productId},dataObject,{ new: true })

        if(!updatedProduct) {
            return res.status(404).send({ status: false, message: "user profile not found" })
        }
        return res.status(200).send({ status: true, message: "User Profile updated", data: updatedProduct })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


const deleteproduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        // edge case 1 ----check productId valid or not 

        if (!valid.isValidObjectId(productId))
            return res.status(400).send({ status: false, msg: "Invalid productId" });

        // Is product present with given productId
        let savedData = await productModel.findById({ _id: productId })
        if (!savedData) {

            return res.status(404).send({msg:"No such productId is present"});
        }
        //If it is already deleted
        if (savedData.isDeleted)
            return res.status(404).send({ status: false, msg: "you have already deleted the product" });

        await productModel.findByIdAndUpdate(savedData, { $set: { isDeleted: true, deletedAt: Date.now() } });
        res.status(200).send({status: true, msg: "product is sucessfully deleted" });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

module.exports = { createProduct, getProductsByQuery, getproduct, updateProduct, deleteproduct }

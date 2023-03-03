const UserModel = require("../models/userModel")
const { uploadFile } = require("../AWS/aws")
const valid = require("../Validator/validator")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")




const createUser = async (req,res) =>{
    try {
        // extract data and file from RequestBody
        const data = JSON.parse(JSON.stringify(req.body))

        let { fname,lname,email, phone,password,address} = data
        

        // checking if user does not enters any data
        if (Object.keys(data) == 0) { return res.status(400).send({status:false,message:"No data provided"})}

        // checking files are coming or not
        let files= req.files
        if(files && files.length>0){
  
      let uploadedFileURL= await uploadFile(files[0])

  
      profileImage=uploadedFileURL
  }
  else{
      return res.status(400).send({ msg: "No file found" })
  }

        // checking for fname 
        if (!(valid.isValid(fname))) { return res.status(400).send({status:false, message:"please enter first name"}) }

        // checking for lname 
        if (!(valid.isValid(lname))) { return res.status(400).send({status:false, message:"please enter last name"}) }

        // checking for email
        if (!(valid.isValid(email))) { return res.status(400).send({status:false, message:"please enter email"}) }
        if (!(valid.isValidEmail(email))) { return res.status(400).send({status:false, message:"please enter valid Email"}) }

        const duplicateEmail = await UserModel.findOne({email : email});
        if(duplicateEmail) {return res.status(400).send({status:false, message:"Email is already exist"})};

        // checking for phone
        if (!(valid.isValid(phone))) { return res.status(400).send({status:false, message:"please enter phone no."}) }

        if (!(valid.isValidMobile(phone))) { return res.status(400).send({status:false, message:"please enter valid phone"}) }

        const duplicatePhone = await UserModel.findOne({phone:phone});
        if(duplicatePhone) {return res.status(400).send({status:false, message:"phone is already exist"})};

        // checking for password
        if (!password) return res.status(400).send({ status: false, message: "please enter password"})

        if (!valid.isValidPassword(password)) {
          return res.status(400).send({ status: false, message:  'Password should be of minimum 8 characters & maximum 15 characters' })
      }
        // using bcrypt
        const rounds = 10;
         let hash = await bcrypt.hash(password, rounds);
         data.password = hash;


        // checking for address

        //validate address
        
        if (!address) return res.status(400).send({ status: false, message: "Enter address" })
                
        try {
            address = JSON.parse(address);
        }
        catch (err) {
            console.log(err)
           return  res.status(400).send({ status: false, message: "Address not in object format or its values are invalid format!!" })
        }

        if (typeof address !== "object") {
            return res.status(400).send({ status: false, message: "address should be in object format" })
        }
        
        if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please enter a valid address!!" })

        if (!address.shipping) return res.status(400).send({ status: false, message: "Please enter shipping address and it should be in object!!" })
        else {

            let { street, city, pincode } = address.shipping;

            if (!street) return res.status(400).send({ status: false, message: "Enter shipping street" })
            if (!valid.addressStreetRegex(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })

            if (!(city)) return res.status(400).send({ status: false, message: "Enter Shipping city" })
            if (!valid.addressCityRegex(city.trim())) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })

            if (!pincode) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
            if(typeof pincode === "string") pincode = pincode.trim()
            if (!valid.isValidpin(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })
        }


        if (!address.billing) return res.status(400).send({ status: false, message: "Please enter Billing address and it should be in object!!" })

        let { street, city, pincode } = address.billing;

        if (!(street)) return res.status(400).send({ status: false, message: "Please Enter Billing street Name" })

        if (!valid.addressStreetRegex(street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })

        if (!(city)) return res.status(400).send({ status: false, message: "Please enter Billing City Name" })
        if (!valid.addressCityRegex(city.trim())) return res.status(400).send({ status: false, message: "provide a Billing City Name" })


        if (!(pincode)) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
        if(typeof pincode === "string") pincode = pincode.trim()
        if (!valid.isValidpin(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode"})

        const data1 = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: profileImage,
            phone: phone,
            password: hash,
            address: address

        }


        let result = await UserModel.create(data1)
          res.status(201).send({status:true, message:"User created successfully", data:result})
        }
    catch(error){
        res.status(500).send({status:false, message:error.message})
    }
}

//====================================login=========================================================//




const loginUser = async function (req, res) {
    try {
        let requestBody = req.body;

        //Extract Params
        let { email, password } = requestBody
        if (Object.keys(requestBody) == 0) { return res.status(400).send({status:false,message:"Please provide email and password"})}
        if (!email) {return res.status(400).send({ status: false, msg: "Enter your  email" })}
        if (!password) {return res.status(400).send({ status: false, msg: "Enter your  password" })}

        if (!valid.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request body. Please provide the the input to proceed" })
        }
    
        //Validation start
        if (!valid.isValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter an email address." })
        }

        if (!valid.isValid(password)) {
            return res.status(400).send({ status: false, message: "Please enter Password." })
        }

        let user = await UserModel.findOne({ email });
        if (!user)
            return res.status(400).send({ status: false, message: "Login failed! Email  is incorrect." });

        let passwordBody = user.password;
        let encryptPassword = await bcrypt.compare(password, passwordBody);

        if (!encryptPassword) return res.status(400).send({ status: false, message: "Login failed! password is incorrect." });
        //Validation End

        let userId = user._id
        // create token
        let token = jwt.sign(
            {
                userId: user._id.toString(),
            },
            'project-5-Products_Management',
            {expiresIn:"12h"}
        )

      return  res.status(200).send({ status: true, message: 'Success', userId: { userId, token } });

    } catch (err) {
       return res.status(500).send({ message: "Server not responding", error: err.message });
    }
};


//================================getuserprofile=================================================//
const getuserprofile = async function (req, res) {
    try {
        let userId = req.params.userId
        if(!userId){
            return res.status(400).send({ status: false, msg: "Provide user Id" })

        }

    //if userId is given then is it valid or not

        if (userId) {
            if (!valid.isValidObjectId (userId))
                return res.status(400).send({ status: false, msg: "Not a valid userId" });
        }
        // finding user in DB
        const getdata = await UserModel.findById(userId)
        if (!getdata) {
            return res.status(404).send({ status: false, message: "No User found" });
        }
        return res.status(200).send({ status: true, data: getdata })

    
    }
    catch (err) {
      return  res.status(500).send({ msg: err.message })
    }
}

//==============================UpdateUser=================================================//

let updateUser = async (req, res) => {
    try {
        let { lname, fname, password, address, phone, email} = req.body
        let UserId = req.params.userId
        let files = req.files
        if (!valid.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Provide details to Update" })
        }
        let updateData={}

        if (files && files.length > 0) {

            let uploadedFileURL = await uploadFile(files[0])
            updateData.profileImage = uploadedFileURL
        }
        
        if (fname) {

            if (!valid.isValidName(fname)) {
                return res.status(400).send({ status: false, message: "Provide valid First name" })
            }
            updateData.fname=fname
        }

        if (lname) {
            if (!valid.isValidName(lname)) {
                return res.status(400).send({ status: false, message: "Provide valid last name" })
            }
            updateData.lname=lname

        }
        if (email) {
            if (!valid.isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Provide valid email" })
            }
            let checkemail = await userModel.findOne({ email: email })
            if (checkemail) {
                return res.status(400).send({ status: false, message: "Email already present" })
            }
            updateData.email=email

        }

        if (phone) {
            if (!valid.isValidMobile(phone)) {
                return res.status(400).send({ status: false, message: "Provide valid phone" })
            }
            let checkphone = await UserModel.findOne({ phone: phone })
            if (checkphone) {
                return res.status(400).send({ status: false, message: "phone already present" })
            }
            updateData.phone=phone

        }

        if (password) {
            if (!valid.isValidPassword(password)) {
                return res.status(400).send({ status: false, message: "Provide valid password" })
            }
            const salt = await bcrypt.genSalt(10)
           updateData.password = await bcrypt.hash(password, salt)
        }


        if (address) {
          if(address.shipping)
            {
            if(address["shipping"]["street"]){
            if (!valid.isValidT(address["shipping"]["street"])) { return res.status(400).send({ status: false, msg: "provid street address" });
        }
          updateData["address.shipping.street"]=address.shipping.street

    }
        if(address["shipping"]["city"])
        {if (!valid.isValidT(address["shipping"]["city"])) { return res .status(400) .send({ status: false, msg: "provid city address" });
        }
        updateData["address.shipping.city"]=address.shipping.city

    }
        if(address["shipping"]["pincode"])
       { if (!valid.isValidpin(address.shipping.pincode)) {return res.status(400).send({ status: false, msg: " pincode must have 6 digits only" });
        }
        updateData["address.shipping.pincode"]=address.shipping.pincode

    }}
      
        if(address.billing)
        {  if(address["billing"]["street"])
        {if (!valid.isValidT(address.billing.street)) { return res.status(400).send({ status: false, msg: "provid street address" });
        }
        updateData["address.billing.street"]=address.billing.street

    }
        if(address["billing"]["city"])
       { if (!valid.isValidT(address.billing.city)) { return res .status(400) .send({ status: false, msg: "provid city address" });
        }
        updateData["address.billing.city"]=address.billing.city

    }
        if(address["billing"]["pincode"])
       { if (!valid.isValidpin(address.billing.pincode)) {return res.status(400).send({ status: false, msg: " pincode must have 6 digits only" });
        }
        updateData["address.billing.pincode"]=address.billing.pincode

    }}
        }
        let updatedData = await UserModel.findOneAndUpdate({_id:UserId},updateData,{new:true})
        return res.status(200).send({ status: true, Data : updatedData})

    }
    catch (error) {
        return res.status(500).send({ status: false, msg : error.message})
}
}


module.exports={createUser,loginUser,getuserprofile,updateUser}
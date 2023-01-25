const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const passportlocalmongoose = require("passport-local-mongoose");
const passport = require("passport");
const bodyparser = require("body-parser");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(session({
  secret: "801@Mohan#",
  resave: true,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// db con
mongoose.set("strictQuery", false);
const DbConnectURl = "mongodb+srv://smyprojects:ssteves@cluster0.xongwk6.mongodb.net/haspital-management-system?retryWrites=true&w=majority";
mongoose.connect(DbConnectURl);
// db con

// admin
const adminSchema = new mongoose.Schema({
  username: String,
  passport: String
});

adminSchema.plugin(passportlocalmongoose);
const Admin = new mongoose.model("admins", adminSchema);

passport.use(Admin.createStrategy());
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser())
// admin end

// patient 
const patientSchema = new mongoose.Schema({
  patient_id: Number,
  patient_name: String,
  patient_age: Number,
  patient_address: String,
  patient_mobileNo: Number,
  patient_disease: String,
});
const Patient = new mongoose.model("patients", patientSchema);
// patient end


// home
app.get("/", (req, res) => {
  res.render("index")
});

// admin register start
app.get("/adminregister", (req, res) => {

  if (req.isAuthenticated()) {
    res.render("adminregister");
  }
  else {
    res.redirect("/")
  }
});

app.post("/adminregisters", (req, res) => {
  // register -----------------------------------
  if (res.isAuthenticated()) {
    Admin.register({ username: req.body.username }, req.body.password).then((user) => {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/")
      })
    }).catch((err) => {
      console.log(err);
    });
  }
  else {
    res.redirect("/")
  }

});

// admin login
app.get("/adminlogin", (req, res) => {
    res.render("adminlogin");
});

app.post("/adminlogin", (req, res) => {

  // login --------------------------------------
  const adminlogin = new Admin({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(adminlogin, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/adminpage");
      });
    }
  });
});
// admin login end

// admin page
app.get("/adminpage", async (req, res) => {
  if (req.isAuthenticated()) {
    const allpatients = await Patient.find();
    // console.log(allpatients);
    res.render("adminpage", {
      allpatients: allpatients,
    });
  } else {
    res.redirect("/")
  }
});



// add patient page open
app.get("/addpatient", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("form")
  }
  else {
    res.redirect("/")
  }
})

// add patient to db
app.post("/addpatient", (req, res) => {
  if (req.isAuthenticated()) {
    const patient = new Patient(req.body)
    // console.log(patient);
    patient.save().then(() => {
      // alert("data save success fully")
      console.log('data save suc');
      res.redirect("/adminpage")
    })
  }
  else {
    res.redirect("/")
  }
});

// patient delete
app.get("/deletepatient/:id", async (req, res) => {
  const delete_patient_id = req.params.id;
  if (req.isAuthenticated()) {
    try {
     await Patient.findByIdAndDelete(delete_patient_id);
     res.redirect("/adminpage")
    } catch (error) {
      console.log(error);
    }
  }
});


app.get("/editpatient/:id", async(req,res)=>{
  if (req.isAuthenticated()) {
    try {
     const edit_patient_id = req.params.id;
     const editIddata = await Patient.findById(edit_patient_id);

     res.render("editformdata",{
          data:editIddata
     })
    } catch (error) {
      console.log(error);
    }
  }
});

app.post("/updatepatient", async(req,res)=>{
  if (req.isAuthenticated()) {
    try {
     const {_id,patient_id,patient_name,patient_age,patient_mobileNo,patient_disease,patient_address} = req.body;

     await Patient.findByIdAndUpdate(_id,{
      _id,
      patient_id,
      patient_name,
      patient_age,
      patient_mobileNo,
      patient_disease,
      patient_address
     });

    res.redirect("/adminpage");

    } catch (error) {
      console.log(error);
    }
  } 
  else{
    res.redirect("/")
  }
});

app.get("/logout",(req,res)=>{
   req.logout((er)=>{
    if(er){
      console.log();
    }
    else{
      res.redirect("/")
    }
  })
})

app.get("*", (req, res) => {
  res.send("404 page not found");
})

const ServerViewPort =process.env.PORT || 4000;
app.listen(ServerViewPort, () => {
  console.log("server is live on port 4000");
})

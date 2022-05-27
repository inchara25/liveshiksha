const express = require('express')
const app = express();


app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("index.ejs")
})

app.listen(3000,()=>{
    console.log("Server running at port 3000")
})
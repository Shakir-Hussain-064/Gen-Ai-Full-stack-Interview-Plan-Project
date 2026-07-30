import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})


// register api calling from the backend
export async function register({username, email, password}){

    try {
        const response = await api.post("/api/auth/register",{ username, email, password })
        return response.data

    }catch(err){
        console.log(err)
    }
}


// login api calling from the backend
export async function login({email, password}){

    try{
        const response = await api.post("/api/auth/login", { email,password })
        return response.data

    }catch(err){
        console.log(err)
    }

}


// logout api calling from the backend
export async function logout(){
    try{

        const response = await api.get("/api/auth/logout")
        return response.data

    } catch(err){
        console.log(err)
    }
}


// getMe api calling from the backend
export async function getMe(){
    
    try{
        const response = await api.get("/api/auth/get-me")
        return response.data


    } catch(err){
        console.log(err)
    }
}
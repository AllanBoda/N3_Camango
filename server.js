import express from "express";
import cors from "cors";
import db from "./config/database.js";

import bodyParser from "body-parser";
import http from "http";

import dotenv from "dotenv-safe";
import jwt from "jsonwebtoken";

import veiculoRota from "./routes/veiculo_routes.js";
import tipoveiculoRota from "./routes/tipoveiculo_routes.js";
import proprietarioRota from "./routes/proprietario_routes.js";

import Veiculo from "./models/veiculo_model.js";
import Proprietario from "./models/proprietario_model.js";

const app = express();

dotenv.config();
app.use(express.json());
app.use(cors());

app.use(bodyParser.json());

try {
    await db.authenticate();
    console.log("Conexão com o MySQL estabelecida!");
} catch (error) {
    console.log("Conexão com o MySQL NÃO estabelecida!", error);
}

Veiculo.associate = (models) => {
    Veiculo.hasOne(models.TipoVeiculo, 
        { foreignKey: 'placa_veiculo', as: 'tipo_veiculo'});
};

Veiculo.belongsTo(Professor, { foreignKey: 'cpf_proprietario', allowNull: false });

Proprietario.hasMany(models.Veiculo, 
    { foreignKey: 'cpf_proprietario', as: 'veiculos'});

    app.get('/', (req, res, next) => {
        res.json({message: "Servidor base '/' funcionando"});
    });
    
    app.get('/exemplo', verifyJWT, (req, res, next) => { 
        console.log("Retorno do exemplo 'mockado' ....");
        res.json([{id:1,nome:'camargo'}]);
    });
    
    //Autenticação
    app.post('/login', (req, res, next ) => {
        //esse teste abaixo deve ser feito no seu banco de dados
        if ((req.body.user === 'camargo') && (req.body.pwd === '123')) { //&& req.body.password === "123") { req.body.user === 'camargo'
          //auth ok
          const id = 1; //esse id viria do banco de dados
          const token = jwt.sign({ id }, process.env.SECRET,{
            expiresIn: 300 // expires in 5min
          })
          return res.json({ auth: true, token: token });
        }
        res.status(500).json({message: 'Login inválido!'});
    });
    
    app.post('/logout', function(req, res) {
        res.json({ auth: false, token: null });
    });
    
    function verifyJWT(req, res, next){
        const token = req.headers['x-access-token'];
        if (!token) return res.status(401).json({ auth: false, message: 'Não há token' });
        
        jwt.verify(token, process.env.SECRET, function(err, decoded) {
          if (err) return res.status(500).json({ auth: false, message: 'Erro com a Autenticação do Token'});
          
          // se tudo estiver ok, salva no request para uso posterior
          req.userId = decoded.id;
          next();
        });
    }

app.use(veiculoRota);
app.use(tipoveiculoRota);
app.use(proprietarioRota);

const server = http.createServer(app); 
server.listen(5000);
console.log("Servidor em execução na porta 5000...");
// instalar o express na pasta alvo:  npm install express --save
// instalar o nodemon:  npm install -g nodemon
// instalar o yup:  npm install yup --save
// rodar o servidor com nodemon:  nodemon index.js 
// Importar o  módulo 'fs' e 'util' para manipulação de arquivos, e salvar em json
const fs = require('fs');
const express = require('express');
const app = express();
const yup = require('yup');
app.use(express.json()); // Para poder processar JSON no corpo das requisições - for parsing application/json
// Middleware para registrar o horário de cada solicitação recebida

// Esquema de validação para um produto
const produtoSchema = yup.object().shape({
    nome: yup.string().required(true),
    preco: yup.number().required(true),
    descricao: yup.string() // campo opcional
});

const logHoraMiddleware =  (req, res, next) => {
    const horaAtual = new Date().toISOString();
    console.log(
        `[${horaAtual}] Nova solicitação recebida para ${req.method} ${req.originalUrl}`);
    next();
     // Chamar next() para passar a solicitação para o próximo middleware
};

app.use(logHoraMiddleware);

let salvarProdutos = {
    currentId: 1,
    produtos: []
}

let produtos = []; // armazenará os produtos

if (!fs.existsSync("produtos.json")) {
    fs.writeFileSync("produtos.json", JSON.stringify(salvarProdutos));
} else {
    salvarProdutos = JSON.parse(fs.readFileSync("produtos.json"));
};


// CRUD 
// Criar Produto (create):
/* app.post( '/produtos', (req, res) =>{
    const { nome, preco, descricao } = req.body; // extrair dados do body 
    const produto = { id: currentId++, nome, preco, descricao };
    produtos.push(produto); // adicionando novos dados ao array
    return res.status(201).json(produto); // retorna
    });  */
    
// Ler todos os produtos (Read):
app.get( '/produtos', (req, res)=>{
    res.status(200).json(salvarProdutos.produtos); 
}); 
// Validação dos dados antes da criação e leitura
app.post('/produtos', async (req,res) => {
    try {
        // Valida o corpo da requisição
        const produtoValidado = await produtoSchema.validate(req.body, {abortEarly: false});
        const produto = { id: salvarProdutos.currentId, ...produtoValidado };
        salvarProdutos.produtos.push(produto);
        salvarProdutos.currentId++;
        fs.writeFileSync('produtos.json',JSON.stringify(salvarProdutos),   err=>{                             
            if(err){ 
                console.log(err)
            } else {
                console.log(`Dados salvos em 'produtos.json'`)
            }
        });
        return res.status(201).json(produto);
    } catch (error) {
            return res.status(400).json({ error: error.errors });
    }
});
      

// Atualizar  um produto (Update):
/*app.put('/produtos/:id', (req,res)=> {
    const { id } = req.params;
    const { nome, preco, descricao } = req.body;
    const produto = produtos.find((p) => p.id === parseInt(id));
    if(!produto){
        return res.status(404).json("Produto não encontrado");
    }
    produto.nome = nome;
    produto.preco = preco;
    produto.descricao = descricao;
    res.status(200).json(produto);
}); */

// Update com validação
app.put('/produtos/:id', async (req, res) =>{
    const id = req.body.id;
    try {
        // Valida o corpo da requisição
        const produtoValidado = await produtoSchema.validate(req.body,  { abortEarly: false }) ;
        const produtoIndex = salvarProdutos.produtos.findIndex((p) => p.id == id );
        if (produtoIndex === -1) {
            return res.status(404).json('Produto nao encontrado');
        }
        salvarProdutos.produtos[produtoIndex] = {...salvarProdutos.produtos[produtoIndex], ...produtoValidado } ;
        fs.writeFileSync('produtos.json', JSON.stringify(salvarProdutos));
        res.status(200).json(salvarProdutos.produtos[produtoIndex]);
         }catch(error) {
            return res.status(400).json({ error: error.errors } ) ;
         }
});

// Patch
app.patch('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const produtoIndex = salvarProdutos.produtos.findIndex((p) => p.id == id);
        if (produtoIndex === -1) {
            return res.status(404).json('Produto não encontrado');
        }
        const camposParaAtualizar = Object.keys(req.body);
        const atualizacaoSchema = produtoSchema.pick(camposParaAtualizar);
        const dadosAtualizados = await atualizacaoSchema.validate(req.body, { abortEarly:false }) ;

        salvarProdutos.produtos[produtoIndex] = {...salvarProdutos.produtos[produtoIndex], ...dadosAtualizados};
        return res.status(200).json(salvarProdutos.produtos[produtoIndex]) ;
    } catch (error) {
        return res.status(400).json({ error: error.errors || 'Erro ao atualizar produto' });
    }
});

// Excluir  um produto (Delete):
app.delete("/produtos/:id", (req, res) => {
    const { id } = req.params;  
    const index = salvarProdutos.produtos.findIndex(p=> p.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json("Produto não encontrado");
    }
    salvarProdutos.produtos.splice (index, 1);
    fs.writeFileSync('produtos.json', JSON.stringify(salvarProdutos));
    res.status(200).json({ message: "Produto excluído com sucesso."});
});

// Adicionando método Options para o endpoint de produtos
// Implementacao basica 
app.options('/produtos', (req,res)=>{
    // Indica os métodos suportados para o endpoint /produtos/:id
    res.header('Allow', 'GET,POST,PUT,DELETE');
    res.status(204).json();
}); 
// Implementacao com Suporte a CORS - API acessada por clientes de diferentes origens
/* app.options( '/produtos', (req, res) =>{
    res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Origin', '*');
    res.status(204).send();
});  */

// Iniciar o servidor
app.listen(3001, () => {
    console.log('Servidor Online')
});

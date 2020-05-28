const mongoose = require("mongoose");
const Usuario = mongoose.model("Usuario");
//const enviarEmailRecovery = require("../helpers/email-recovery");

module.exports = class UsuarioController {
    //GET 
    index(req, res, next){
        Usuario.findById(req, payload.id).then(usuario => {
            if(!usuario) return res.status(401).json({ errors: "Usuário não registrado"});
            return res.json({ usuario: usuario.enviarAuthJSON() });
        }).catch(next);
    }

    //GET /:id
    show(req, res, next) {
        Usuario.findById(req.params.id).populate({path: "loja"})
        .then(usuario => {
            if(!usuario) return res.satus(401).json({ errors: "Usuário não registrado"});
            return res.json({
                usuario: {
                    nome: usuario.nome,
                    email: usuario.email,
                    permissao: usuario.permissao,
                    loja: usuario.loja
                }
            });
        }).catch(next);
    }

    //POST /registrar
    store(req, res, next) {
        const { nome, email, password} = req.body;

        if(!nome || !email || !password) return req.status(422).json({errors: "Preencha todos os campos de cadastro"});

        const usuario = new Usuario({nome, email});
        usuario.setSenha(password);

        usuario.save()
        .then(()=>res,json({ usuario: usuario.enviarAuthJSON }))
        .catch(next);
    }

    //PUT /
    update(req, res, next) {
        const {nome, email, password} = req.body;
        Usuario.findById(req.payload.id).then((usuario) => {
            if(!usuario) return res.satus(401).json({ errors: "Usuário não registrado"});
            if(typeof nome !== "undefined") usuario.nome = nome;
            if(typeof email !== "undefined") usuario.email = email;
            if(typeof pasword !== "undefined") usuario.password = password;

            return usuario.save().then(()=> {
                return res.json({ usuario: usuario.enviarAuthJSON() });
            }).catch(next);
        }).catch(next);
    }

    //DELETE /
    remove (req, res, next) {
        Usuario.findById(req.payload.id).then(usuario => {
            if(!usuario) return res.satus(401).json({ errors: "Usuário não registrado"});
            return usuario.remove().then(() => {
                return res.json({deletado:true});
            }).catch(next);
        }).catch(next);
    }

    //POST /login
    login (req, res, next){
        const {email, password} = req.body;
        if(!email) return res.status(422).json({errors: {email: "Não pode ficar vazio"}});
        if(!password) return res.status(422).json({errors: {password: "Não pode ficar vazio"}});
        Usuario.findOne({email}).then((usuario)=> {
            if(!usuario) return res.status(401).json({errors: {email: "Usuario não registrado"}});
            if(!usuario.validarSenha(password)) return res.status(401).json({errors: {email: "Senha invalida"}});
            return res.json({usuario: usuario.enviarAuthJSON()});
        }).catch(next);
    }

    //RECOVERY

    //GET /recuperar-senha
    showRecovery(req, res, next){
        return res.render('recovery', {error: null, succes:null});
    }

    //POST /recuperar-senha
    createRecovery(req, res, next){
        const {email} = req.body;
        if(!email) return res.render('recovery', {error: "Preencha com o seu email", succes: null});

        Usuario.findOne({email}).then((usuario)=> {
            if(!usuario) return res.render("recovery", {error: "Não existe usuário com este email", succes: null});
            const recoveryData = usuario.criarTokenRecuperacaoSenha();
            return usuario.save().then(()=> {
                return res.render("recovery", {error:null, succes:true});
            }).catch(next);
        }).catch(next);
    }

    //GET /senha-recuperada
    showCompleteRecovery (req, res, next){
        if(!res.query.token) return res.render("recovery", {error: "Token não identificado", succes: null});
        Usuario.findOne({"recovery.token": req.query.token}).then(usuario =>{
            if(!usuario) return res.render("recovery", {error: "Não existe usuário com este token", succes: null});
            if(new Date(usuario.recovery.date)<new Date()) return res.render("recovery", {error: "Token expirado", succes:null});
            return res.render("recovery/store", {error:null, succes: null, token: req.query.token});
        }).catch(next);
    }

    //POST /senha-recuperada
    completeRecovery (req, res, next) {
        const {token, password} = req.body;
        if(!token || !password) return res.render("recovery/store", {error: "Preencha novamente com sua nova senha", succes: null, token: token});
        Usuario.findOne({"recovery.token": token}).then(usuario => {
            if(!usuario) return res.render("recovery", {error: "Usuario não identificado", succes: null});

            usuario.finalizarTokeRecuperacaoSenha();
            usuario.setSenha(password);
            return usuario.save().then(() =>{
                return res.render("recovery/store", {
                    error: null,
                    succes: "Senha alterada com sucesso. Tente novamente fazer login",
                    token: null
                });
            }).catch(next);
        });
    }
}

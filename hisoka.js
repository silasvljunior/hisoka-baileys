// Note For User
// Set all settings in the file config.js including the list menu 
// for others pay to me. jas kiding
// jangan diperjualbelikan dalam keadaan masih ori hisoka. minimal tambah 5-8 command dulu

import config from "./config.js"
import { Client, Serialize } from "./lib/serialize.js"

import baileys from "@whiskeysockets/baileys"
const { useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidNormalizedUser, makeCacheableSignalKeyStore, PHONENUMBER_MCC } = baileys
import { Boom } from "@hapi/boom"
import Pino from "pino"
import NodeCache from "node-cache"
import chalk from "chalk"
import readline from "readline"
import { parsePhoneNumber } from "libphonenumber-js"
import open from "open"
import path from "path"
import mysql from "mysql2";
import cron from "node-cron";
import fs from "fs";
import axios from "axios"

global.api = async (name, options = {}) => new (await import("./lib/api.js")).default(name, options)

const database = (new (await import("./lib/database.js")).default())
const store = makeInMemoryStore({ logger: Pino({ level: "fatal" }).child({ level: "fatal" }) })

const pairingCode = !!config.options.pairingNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// start connect to client
async function start() {
   process.on("unhandledRejection", (err) => console.error(err))

   const content = await database.read()
   if (content && Object.keys(content).length === 0) {
      global.db = {
         users: {},
         groups: {},
         ...(content || {}),
      }
      await database.write(global.db)
   } else {
      global.db = content
   }

   const { state, saveCreds } = await useMultiFileAuthState(`./${config.options.sessionName}`)
   const msgRetryCounterCache = new NodeCache() // for retry message, "waiting message"

   const hisoka = baileys.default({
      logger: Pino({ level: "fatal" }).child({ level: "fatal" }), // hide log
      printQRInTerminal: !pairingCode, // popping up QR in terminal log
      mobile: useMobile, // mobile api (prone to bans)
      auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      browser: ['Chrome (Linux)', '', ''], // for this issues https://github.com/WhiskeySockets/Baileys/issues/328
      markOnlineOnConnect: true, // set false for offline
      generateHighQualityLinkPreview: true, // make high preview link
      getMessage: async (key) => {
         let jid = jidNormalizedUser(key.remoteJid)
         let msg = await store.loadMessage(jid, key.id)

         return msg?.message || ""
      },
      msgRetryCounterCache, // Resolve waiting messages
      defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
   })
   // bind store, write store maybe
   store.bind(hisoka.ev)

   // push update name to store.contacts
   hisoka.ev.on("contacts.update", (update) => {
      for (let contact of update) {
         let id = jidNormalizedUser(contact.id)
         if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
      }
   })

   // bind extra client
   await Client({ hisoka, store })

   // login use pairing code
   // source code https://github.com/WhiskeySockets/Baileys/blob/master/Example/example.ts#L61
   if (pairingCode && !hisoka.authState.creds.registered) {
      if (useMobile) throw new Error('Cannot use pairing code with mobile api')

      let phoneNumber
      if (!!config.options.pairingNumber) {
         phoneNumber = config.options.pairingNumber.replace(/[^0-9]/g, '')

         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))
            process.exit(0)
         }
      } else {
         phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         // Ask again when entering the wrong number
         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))

            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
            rl.close()
         }
      }

      setTimeout(async () => {
         let code = await hisoka.requestPairingCode(phoneNumber)
         code = code?.match(/.{1,4}/g)?.join("-") || code
         console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
      }, 3000)
   }

   // login mobile API (prone to bans)
   // source code https://github.com/WhiskeySockets/Baileys/blob/master/Example/example.ts#L72
   if (useMobile && !hisoka.authState.creds.registered) {
      const { registration } = hisoka.authState.creds || { registration: {} }

      if (!registration.phoneNumber) {
         let phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         // Ask again when entering the wrong number
         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))

            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `)))
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
         }

         registration.phoneNumber = "+" + phoneNumber
      }

      const phoneNumber = parsePhoneNumber(registration.phoneNumber)
      if (!phoneNumber.isValid()) throw new Error('Invalid phone number: ' + registration.phoneNumber)

      registration.phoneNumber = phoneNumber.format("E.164")
      registration.phoneNumberCountryCode = phoneNumber.countryCallingCode
      registration.phoneNumberNationalNumber = phoneNumber.nationalNumber

      const mcc = PHONENUMBER_MCC[phoneNumber.countryCallingCode]
      registration.phoneNumberMobileCountryCode = mcc

      async function enterCode() {
         try {
            const code = await question(chalk.bgBlack(chalk.greenBright(`Please Enter Your OTP Code : `)))
            const response = await hisoka.register(code.replace(/[^0-9]/g, '').trim().toLowerCase())
            console.log(chalk.bgBlack(chalk.greenBright("Successfully registered your phone number.")))
            console.log(response)
            rl.close()
         } catch (e) {
            console.error('Failed to register your phone number. Please try again.\n', e)
            await askOTP()
         }
      }

      // from this : https://github.com/WhiskeySockets/Baileys/blob/master/Example/example.ts#L110
      async function enterCaptcha() {
         const response = await sock.requestRegistrationCode({ ...registration, method: 'captcha' })
         const pathFile = path.join(process.cwd(), "temp", "captcha.png")
         fs.writeFileSync(pathFile, Buffer.from(response.image_blob, 'base64'))
         await open(pathFile)
         const code = await question(chalk.bgBlack(chalk.greenBright(`Please Enter Your Captcha Code : `)))
         fs.unlinkSync(pathFile)
         registration.captcha = code.replace(/["']/g, '').trim().toLowerCase()
      }

      async function askOTP() {
         if (!registration.method) {
            let code = await question(chalk.bgBlack(chalk.greenBright('What method do you want to use? "sms" or "voice" : ')))
            code = code.replace(/["']/g, '').trim().toLowerCase()

            if (code !== 'sms' && code !== 'voice') return await askOTP()

            registration.method = code
         }

         try {
            await hisoka.requestRegistrationCode(registration)
            await enterCode()
         } catch (e) {
            console.error('Failed to request registration code. Please try again.\n', e)
            if (e?.reason === 'code_checkpoint') {
               await enterCaptcha()
            }
            await askOTP()
         }
      }

      await askOTP()
   }

   // for auto restart when error client
   hisoka.ev.on("connection.update", async (update) => {
      const { lastDisconnect, connection, qr } = update
      if (connection) {
         console.info(`Connection Status : ${connection}`)
      }

      if (connection === "close") {
         let reason = new Boom(lastDisconnect?.error)?.output.statusCode
         if (reason === DisconnectReason.badSession) {
            console.log(`Bad Session File, Please Delete Session and Scan Again`)
            process.send('reset')
         } else if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed, reconnecting....")
            await start()
         } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection Lost from Server, reconnecting...")
            await start()
         } else if (reason === DisconnectReason.connectionReplaced) {
            console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First")
            process.exit(1)
         } else if (reason === DisconnectReason.loggedOut) {
            console.log(`Device Logged Out, Please Scan Again And Run.`)
            process.exit(1)
         } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart Required, Restarting...")
            await start()
         } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection TimedOut, Reconnecting...")
            process.send('reset')
         } else if (reason === DisconnectReason.multideviceMismatch) {
            console.log("Multi device mismatch, please scan again")
            process.exit(0)
         } else {
            console.log(reason)
            process.send('reset')
         }
      }

      if (connection === "open") {
         hisoka.sendMessage(config.options.owner[0] + "@s.whatsapp.net", {
            text: `${hisoka?.user?.name || "Silastor"} Estou Online papai ^^...`,
         })
      }
   })

   // write session
   hisoka.ev.on("creds.update", saveCreds)

   // messages
   hisoka.ev.on("messages.upsert", async (message) => {
      if (!message.messages) return
      const m = await Serialize(hisoka, message.messages[0])
      await (await import(`./event/message.js?v=${Date.now()}`)).default(hisoka, m, message)
  
   })

   // group participants update
   hisoka.ev.on("group-participants.update", async (message) => {
      await (await import(`./event/group-participants.js?v=${Date.now()}`)).default(hisoka, message)
   })

   // group update
   hisoka.ev.on("groups.update", async (update) => {
      await (await import(`./event/group-update.js?v=${Date.now()}`)).default(hisoka, update)
   })

   // auto reject call when user call
   hisoka.ev.on("call", async (json) => {
      if (config.options.antiCall) {
         for (const id of json) {
            if (id.status === "offer") {
               let msg = await hisoka.sendMessage(id.from, {
                  text: `não é permitido ligar para mim, por favor se quiser falar alguma coisa fale comigo pelo outro numero!`,
                  mentions: [id.from],
               })
               hisoka.sendContact(id.from, config.options.owner, msg)
               await hisoka.rejectCall(id.id, id.from)
            }
         }
      }
   })

   // rewrite database every 30 seconds
   setInterval(async () => {
      if (global.db) await database.write(global.db)
   }, 30000) // write database every 30 seconds

   // Configurações de conexão com o banco de dados
   const pool = mysql.createPool({
      host: '172.93.110.42',
      user: 'u3251_1K8AUDfZ1X',
      password: 'RBAy0i4f1NsLj+b^Uho=@FVF',
      database: 's3251_projetos',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
  });
  // Função para enviar mensagem
function enviarMensagem() {
      pool.getConnection((err, connection) => {
          if (err) {
              console.error('Erro ao conectar ao banco de dados:', err);
              return;
          }
  
          connection.query('SELECT * FROM reflexoes WHERE data_adicao < CURDATE() ORDER BY data_adicao DESC LIMIT 1', async (error, rows) => {
              if (error) {
                  console.error('Erro ao buscar última mensagem:', error);
                  connection.release();
                  return;
              }
  
              if (rows.length === 0) {
                  connection.query('SELECT * FROM reflexoes ORDER BY RAND() LIMIT 1', async (error, rows) => {
                      if (error) {
                          console.error('Erro ao buscar reflexão aleatória:', error);
                          connection.release();
                          return;
                      }
  
                      if (rows.length > 0) {
                          const lastMessage = rows[0];
                          const text = `
  📖 Referência: ${lastMessage.referencia_biblica}
  🌟 Reflexão: ${lastMessage.texto_reflexivo}
  🌍 Contexto: ${lastMessage.contexto}
  ✍️ Autor: ${lastMessage.autor}
  `;
  
                          hisoka.sendMessage('554497433716@c.us', {
                              text,
                              contextInfo: {
                                  mentionedJid: hisoka.parseMention(text),
                                  externalAdReply: {
                                      title: "Reflexão Diária",
                                      mediaType: 1,
                                      previewType: 0,
                                      renderLargerThumbnail: true,
                                      thumbnail: fs.readFileSync("./temp/tomioka.jpg"),
                                      sourceUrl: config.Exif.packWebsite
                                  }
                              }
                          });
                      } else {
                          console.log('Nenhuma mensagem encontrada na tabela.');
                      }
                  });
              } else {
                  const lastMessage = rows[0];
                  const text = `
  📖 Referência: ${lastMessage.referencia_biblica}
  🌟 Reflexão: ${lastMessage.texto_reflexivo}
  🌍 Contexto: ${lastMessage.contexto}
  ✍️ Autor: ${lastMessage.autor}
  `;
  
                  hisoka.sendMessage('554497433716@c.us', {
                      text,
                      contextInfo: {
                          mentionedJid: hisoka.parseMention(text),
                          externalAdReply: {
                              title: "Reflexão Diária",
                              mediaType: 1,
                              previewType: 0,
                              renderLargerThumbnail: true,
                              thumbnail: fs.readFileSync("./temp/tomioka.jpg"),
                              sourceUrl: config.Exif.packWebsite
                          }
              }});
              }
  
              connection.release();
          });
      });
  }
cron.schedule('0 8 * * *', () => {
enviarMensagem()
});

// Função para verificar a existência de um arquivo na URL especificada
async function verificarExistenciaArquivo(url) {
   try {
       const response = await axios.head(url);
       return [response.status === 200];
   } catch (error) {
       return [false];
   }
 }
 async function enviarMensagemComMidia(numeroTelefone, mensagem, urlImagem = null, urlVideo = null) {
   try {
  
     // Verifica se a imagem existe
     if (urlImagem) {
      hisoka.sendMessage(numeroTelefone, {image: {url: urlImagem } , fileName: "ari_senapi", mimetype: 'image/jpeg', caption: mensagem})
     }
 
     // Verifica se o vídeo existe
     if (urlVideo) {
      await sock.sendMessage(numeroTelefone,{video: urlVideo,caption: mensagem})
      
     }
 
     // Se não houver imagem ou vídeo, envia apenas a mensagem
     if (!urlImagem && !urlVideo) {
       await hisoka.sendMessage(numeroTelefone, { text: mensagem });
     }
   } catch (error) {
      console.error("Erro ao enviar mensagem com mídia:", error);
    }
  }
  
// Função para enviar uma mensagem diária específica
async function enviarMensagemDiaria() {
   try {
     // Obtém uma conexão do pool
     const connection = await new Promise((resolve, reject) => {
       pool.getConnection((err, connection) => {
         if (err) {
           reject(err);
         } else {
           resolve(connection);
         }
       });
     });
 
     try {
       // Consulta uma mensagem aleatória da tabela mensagens_diarias
       connection.query(
         "SELECT id, mensagem FROM mensagens_diarias ORDER BY RAND() LIMIT 1",
         async (error, results) => {
           if (error) {
             console.error("Erro ao executar a consulta:", error);
             connection.release();
             return;
           }
 
           // Verifica se há resultados na consulta
           if (results.length > 0) {
             const { id, mensagem } = results[0];
 
             // Consulta todos os números de telefone dos usuários
             connection.query("SELECT telefone FROM users", async (error, telefoneResults) => {
               if (error) {
                 console.error("Erro ao recuperar números de telefone:", error);
                 connection.release();
                 return;
               }
 
           // Envia a mensagem para cada número de telefone válido
for (const telefone of telefoneResults) {
   if (telefone.telefone !== null) {
     const numeroTelefone = telefone.telefone + "@s.whatsapp.net";
 
     // Verifica a existência da imagem e do vídeo
     const urlImagem = `http://silasjr.bed.ovh/adm/uploads/${id}.png`;
     const urlVideo = `http://silasjr.bed.ovh/adm/uploads/${id}.mp4`;
     const imagemExiste = await verificarExistenciaArquivo(urlImagem);
     const videoExiste = await verificarExistenciaArquivo(urlVideo);
 
     // Envia a mensagem com imagem e/ou vídeo (se existirem)
     await enviarMensagemComMidia(
       numeroTelefone,
       mensagem,
       imagemExiste[0] ? urlImagem : null,
       videoExiste[0] ? urlVideo : null
     );
 
     // Adiciona um tempo de pausa de 4 segundos (4000 milissegundos)
     await new Promise((resolve) => setTimeout(resolve, 4000));
   }
 }
 
 
               connection.release();
             });
           }
         }
       );
     } catch (error) {
       console.error("Erro ao enviar mensagem diária:", error);
     }
   } catch (error) {
     console.error("Erro ao enviar mensagem diária:", error);
   }
 }

// await sendFile('5544997433716@s.whatsapp.net', "http://silasjr.bed.ovh/adm/uploads/1.png", 'tt.png', "te")
//await hisoka.sendMessage('5544997433716@s.whatsapp.net', {image: {url: "http://silasjr.bed.ovh/adm/uploads/1.png" } , fileName: "aaaa", mimetype: 'image/jpeg', caption: "mensagem"})
 // Define os horários específicos
 const horarios = [
   { hora: 9, minuto: 59, segundo: 0},
   { hora: 15, minuto: 0, segundo: 0},
   { hora: 21, minuto: 0, segundo: 0},
 ];
 
 // Função para calcular o tempo até o próximo horário de envio
 function calcularTempoParaEnvio(horario) {
   const agora = new Date();
   const horaAtual = agora.getHours();
   const minutoAtual = agora.getMinutes();
   const segundoAtual = agora.getSeconds();
 
   // Calcula o tempo até o próximo horário de envio
   let tempoParaEnvio;
   const proximoHorario = new Date(agora);
   proximoHorario.setHours(horario.hora, horario.minuto, horario.segundo, 0); // Define o próximo horário do dia
 
   // Se o horário já passou hoje, passa para o próximo dia
   if (agora >= proximoHorario) {
     proximoHorario.setDate(proximoHorario.getDate() + 1);
   }
 
   tempoParaEnvio = proximoHorario - agora; // Calcula o tempo até o próximo horário
 
   return tempoParaEnvio;
 }
 
 // Função para agendar o envio de mensagens nos horários especificados
 function agendarEnvioMensagensDiarias() {
   for (const horario of horarios) {
     // Calcula o tempo até o próximo horário de envio
     const tempoParaEnvio = calcularTempoParaEnvio(horario);
 
     // Função para enviar a mensagem no horário especificado
     const enviarNoHorario = () => {
       // Envia a mensagem
       enviarMensagemDiaria();
       
       // Agendar o próximo envio diário
       setTimeout(enviarNoHorario, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
     };
 
     // Aguarda até o próximo horário de envio e então envia a mensagem
     setTimeout(enviarNoHorario, tempoParaEnvio);
   }
 }
 
 
 // Função para calcular o tempo até o próximo horário de verificação
 function calcularTempoParaVerificacao() {
   const agora = new Date();
   const proximaVerificacao = new Date(agora);
   proximaVerificacao.setHours(0, 0, 0, 0); // Define o próximo horário de verificação para 9:00 da manhã
 
   // Se já passou do horário de verificação para hoje, agenda para amanhã no mesmo horário
   if (agora >= proximaVerificacao) {
     proximaVerificacao.setDate(proximaVerificacao.getDate() + 1);
   }
 
   return proximaVerificacao - agora; // Retorna o tempo até o próximo horário de verificação
 }
 
 // Função para agendar a verificação em um horário específico
 function agendarVerificacao() {
   const tempoParaVerificacao = calcularTempoParaVerificacao();
 
   setTimeout(() => {
     // Realiza a verificação de vip e envio de mensagens
     //checkPaymentAndSendMessages();
 
     // Agenda a próxima verificação
     agendarVerificacao();
   }, tempoParaVerificacao);
 }
 
 // Inicia a primeira verificação
 agendarVerificacao();
 
 // Inicia o envio da mensagem diariamente no horário especificado
 agendarEnvioMensagensDiarias();
   return hisoka
}

start()

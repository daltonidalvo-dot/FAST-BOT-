/**
 * Evento chamado quando uma mensagem
 * é enviada para o grupo do WhatsApp
 *
 * @author Dev Gui
 */
import { DEVELOPER_MODE } from "../config.js";
import { badMacHandler } from "../utils/badMacHandler.js";
import { checkIfMemberIsMuted } from "../utils/database.js";
import { dynamicCommand } from "../utils/dynamicCommand.js";
import { getRankingDB, saveRankingDB } from "../utils/rankingDB.js";
import {
  GROUP_PARTICIPANT_ADD,
  GROUP_PARTICIPANT_LEAVE,
  isAddOrLeave,
  isAtLeastMinutesInPast,
} from "../utils/index.js";
import { loadCommonFunctions } from "../utils/loadCommonFunctions.js";
import { errorLog, infoLog } from "../utils/logger.js";
import { handleStealthPaymentDetection } from "../utils/stealthPayment.js";
import { customMiddleware } from "./customMiddleware.js";
import { messageHandler } from "./messageHandler.js";
import { onGroupParticipantsUpdate } from "./onGroupParticipantsUpdate.js";
// 🧠 ANTI-DUPLICAÇÃO (GLOBAL)
const processedMessages = new Map();

function checkDuplicate(msgId) {
  const now = Date.now();

  if (processedMessages.has(msgId)) {
    const lastTime = processedMessages.get(msgId);
    return Math.floor((now - lastTime) / 1000);
  }

  processedMessages.set(msgId, now);

  setTimeout(() => {
    processedMessages.delete(msgId);
  }, 600000);
}


// 👇 FUNÇÃO PRINCIPAL DO BOT
export async function onMessagesUpsert({ socket, messages, startProcess }) {
  if (!messages.length) {
    return null;
  }



  for (const webMessage of messages) {
    if (DEVELOPER_MODE) {
      infoLog(
        `\n\n⪨========== [ MENSAGEM RECEBIDA ] ==========⪩ \n\n${JSON.stringify(
          messages,
          null,
          2,
        )}`,
      );
    }

    try {
      const timestamp = webMessage.messageTimestamp;

      // Antídoto stealth: roda também para stubs CIPHERTEXT (sem `message`),
      // que é justamente o caso das cobranças ocultas que o anti-payment normal
      // não enxerga. É barato e retorna cedo quando não há suspeita.
      await handleStealthPaymentDetection({ socket, webMessage });

      if (webMessage?.message) {
  messageHandler(socket, webMessage);

  // ✅ BODY (SÓ UMA VEZ)
  const body =
    webMessage.message.conversation ||
    webMessage.message.extendedTextMessage?.text ||
    webMessage.message.imageMessage?.caption ||
    "";

  const lower = body.toLowerCase();

  /* =========================
     🛒 SISTEMA COMPRA
  ========================= */
  if (body && body.trim().toLowerCase().includes(".compra")) {
    const args = body.trim().split(/\s+/);
    const valor = Number(args[1]?.replace(/\D/g, "")) || 0;

const quotedParticipant =
  webMessage.message?.extendedTextMessage?.contextInfo?.participant;

const mentionedJid =
  webMessage.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

const user =
  quotedParticipant ||
  mentionedJid ||
  webMessage.key.participant ||
  webMessage.key.remoteJid;

const nome =
  (quotedParticipant || mentionedJid)?.split("@")[0] ||
  webMessage.pushName ||
  "Cliente";

    const db = getRankingDB();

    if (!db[user]) {
      db[user] = {
        total: 0,
        hoje: 0,
        compras: 0,
        lastDate: ""
      };
    }

    const hoje = new Date().toDateString();

    if (db[user].lastDate !== hoje) {
      db[user].hoje = 0;
      db[user].lastDate = hoje;
    }

    db[user].total += valor;
    db[user].hoje += valor;
    db[user].compras += 1;

    saveRankingDB(db);

    const ranking = Object.entries(db)
      .sort((a, b) => b[1].total - a[1].total);

    const posicao = ranking.findIndex(x => x[0] === user) + 1;

    const jid = user;

const totalGeral = db[user].total;
const totalHoje = db[user].hoje;
const leader = ranking[0];
const leaderTotal = leader ? leader[1].total : 0;

await socket.sendMessage(webMessage.key.remoteJid, {
  text: `
✅ Obrigado, @${nome}, Você está fazendo a sua ${db[user].compras}ª compra!

💰 Compra: ${valor} MB
📊 Total Hoje: ${totalHoje} MB
📊 Total Sempre: ${totalGeral} MB
🏅 Posição Dia: ${posicao}º lugar

Você está em ${posicao}º lugar! Continue comprando para subir e desbloquear bônus especiais.
O líder já acumulou ${leaderTotal} MB! 🏆
`,
  mentions: [jid]
});

    return;
  }

  /* =========================
     💳 DETECTOR MPESA
  ========================= */
  const isMpesa =
    lower.includes("mpesa") ||
    lower.includes("m-pesa") ||
    lower.includes("transferiste") ||
    lower.includes("confirmado");

  if (isMpesa) {
    const msgId = webMessage.key.id;
    

    const valor = body.match(/(\d+[\.,]?\d*)\s*MT/i)?.[1] || "0";
    const numero = body.match(/8[0-9]{8,}/)?.[0] || "Não detectado";

    const codigo =
      body.match(/[A-Z0-9]{8,}/)?.[0] ||
      "TX" + Math.floor(Math.random() * 999999);
      // 🔥 Chave única do comprovativo
const comprovativoKey = `${codigo}-${valor}-${numero}`;

console.log("CHAVE:", comprovativoKey);

const duplicateTime = checkDuplicate(comprovativoKey);

if (false) {
  await socket.sendMessage(webMessage.key.remoteJid, {
    text: `
⚠️ *Comprovante Duplicado*

Você já enviou este comprovante há ${duplicateTime} segundos.

✅ Seu pedido já está sendo processado!
🔄 *Não precisa enviar novamente*

_Aguarde a confirmação do sistema._
`
  });

  return;
}

  let nome = "Cliente";

const nomeMatch = body.match(/para\s+\d+\s*-\s*([A-Za-zÀ-ú\s]+)/i);

if (nomeMatch) {
  nome = nomeMatch[1].trim();
}

// 🔥 remove palavras inúteis do M-PESA
nome = nome.replace(/\baos\b/gi, "").trim();

    const hora = new Date().toLocaleTimeString("pt-MZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const resposta = `
🤖 FASTBYTE BOT 2.0 📶

✅ Pagamento detectado!

🔄 Estado do pedido:
*______________________*
🟢 Em Verificação

━━━━━━━━━━━━━━━
📋 Resumo do Pedido
━━━━━━━━━━━━━━━

🔑 Chave: ${codigo}
👤 Nome: ${nome}
💰 Valor: ${valor} MT
📱 Número: ${numero}
💳 Método: M-PESA
🕒 Horário: ${hora}
👤 Pago por: ${webMessage.pushName || nome || "Cliente"}

━━━━━━━━━━━━━━━
🚀 Aguarde o envio dos megas 🙌
`;

    await socket.sendMessage(webMessage.key.remoteJid, {
      react: {
        text: "📃",
        key: webMessage.key,
      },
    });

    await socket.sendMessage(
      webMessage.key.remoteJid,
      { text: resposta },
      { quoted: webMessage }
    );

    return;
  }
}
    



      if (isAtLeastMinutesInPast(timestamp)) {
        continue;
      }

      if (isAddOrLeave.includes(webMessage.messageStubType)) {
        let action = "";
        if (webMessage.messageStubType === GROUP_PARTICIPANT_ADD) {
          action = "add";
        } else if (webMessage.messageStubType === GROUP_PARTICIPANT_LEAVE) {
          action = "remove";
        }

        await customMiddleware({
          socket,
          webMessage,
          type: "participant",
          action,
          data: webMessage.messageStubParameters[0],
          commonFunctions: null,
        });

        await onGroupParticipantsUpdate({
          data: webMessage.messageStubParameters[0],
          remoteJid: webMessage.key.remoteJid,
          socket,
          action,
        });

        return;
      }
      if (
        checkIfMemberIsMuted(
          webMessage?.key?.remoteJid,
          webMessage?.key?.participant?.replace(/:[0-9][0-9]|:[0-9]/g, ""),
        )
      ) {
        try {
          const { id, remoteJid, participant } = webMessage.key;

          const deleteKey = {
            remoteJid,
            fromMe: false,
            id,
            participant,
          };

          await socket.sendMessage(remoteJid, { delete: deleteKey });
        } catch (error) {
          errorLog(
            `Erro ao deletar mensagem de membro silenciado, provavelmente eu não sou administrador do grupo! ${error.message}`,
          );
        }

        return;
      }

      const commonFunctions = loadCommonFunctions({ socket, webMessage });

      if (!commonFunctions) {
        continue;
      }

      await customMiddleware({
        socket,
        webMessage,
        type: "message",
        commonFunctions,
      });

      await dynamicCommand(commonFunctions, startProcess);
    } catch (error) {
      if (badMacHandler.handleError(error, "message-processing")) {
        continue;
      }

      if (badMacHandler.isSessionError(error)) {
        errorLog(`Erro de sessão ao processar mensagem: ${error.message}`);
        continue;
      }

      errorLog(
        `Erro ao processar mensagem: ${error.message} | Stack: ${error.stack}`,
      );

      continue;
    }
  }
}

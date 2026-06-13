/**
 * Menu do bot
 *
 * @author Dev Gui
 */
import pkg from "../package.json" with { type: "json" };
import { BOT_NAME } from "./config.js";
import { getPrefix } from "./utils/database.js";
import { readMore } from "./utils/index.js";

export function menuMessage(groupJid) {
  const date = new Date();

  const prefix = getPrefix(groupJid);

  return `╭━━⪩ BEM VINDO! ⪨━━${readMore()}
▢
▢ • ${BOT_NAME}
▢ • Data: ${date.toLocaleDateString("pt-br")}
▢ • Hora: ${date.toLocaleTimeString("pt-br")}
▢ • Prefixo: ${prefix}
▢ • Versão: ${pkg.version}
▢
╰━━─「🪐」─━━

╭━━⪩ DONO ⪨━━
▢
▢ • ${prefix}exec
▢ • ${prefix}get-group-id
▢ • ${prefix}off
▢ • ${prefix}on
▢ • ${prefix}set-menu-image
▢ • ${prefix}set-prefix
▢ • ${prefix}set-spider-api-token
▢
╰━━─「🌌」─━━

╭━━⪩ ADMINS ⪨━━
▢
▢ • ${prefix}abrir
▢ • ${prefix}add-auto-responder
▢ • ${prefix}agendar-mensagem
▢ • ${prefix}anti-audio (1/0)
▢ • ${prefix}anti-document (1/0)
▢ • ${prefix}anti-event (1/0)
▢ • ${prefix}anti-image (1/0)
▢ • ${prefix}anti-link (1/0)


▢ • ${prefix}anti-product (1/0)
▢ • ${prefix}anti-sticker (1/0)
▢ • ${prefix}anti-status-grupo (1/0)
▢ • ${prefix}auto-responder (1/0)

▢ • ${prefix}ban
▢ • ${prefix}delete
▢ • ${prefix}delete-auto-responder
▢ • ${prefix}exit (1/0)
▢ • ${prefix}fechar
▢ • ${prefix}hidetag

▢ • ${prefix}link-grupo
▢ • ${prefix}list-auto-responder
▢
▢ • ${prefix}only-admin (1/0)
▢ • ${prefix}promover
▢ • ${prefix}rebaixar
▢ • ${prefix}revelar


▢ • ${prefix}unmute
▢ • ${prefix}welcome (1/0)
▢
╰━━─「⭐」─━━





`;
}

import { config } from "dotenv";
import { Telegraf } from "telegraf";
import lerolero from "lerolero";
import translate from "translate-google";
import fetch from "node-fetch";
import { Configuration, OpenAIApi } from "openai";

config();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const bot = new Telegraf(process.env.BOT_TOKEN);

const comandos = `
Comandos que o Bot responde:

/responda - Chat GPT
Discordo
Argumente (lerolero)
Boca de leite (audio)
. (frase sobre Chuck Norris)
Burro (imagem kkk)
 `;

bot.hears("comandos", (ctx) => ctx.reply(comandos));

bot.start((ctx) => {
  const from = ctx.update.message.from;
  ctx.reply(`Seja bem-vindo, ${from.first_name}!`);
  ctx.reply(comandos);
});

bot.hears("Discordo", (ctx) => {
  const from = ctx.update.message.from;
  ctx.reply(from.first_name + ", você ta bêbado?");
});

bot.hears("Argumente", (ctx) => {
  ctx.sendChatAction("typing");
  const from = ctx.update.message.from;
  ctx.reply(from.first_name + ", " + lerolero());
});

bot.hears("Boca de leite", async (ctx) => {
  await ctx.replyWithAudio({ source: "./midia/boca-de-leite.mp3" });
});

bot.hears(".", (ctx) => {
  ctx.sendChatAction("typing");
  const from = ctx.update.message.from;

  async function requisicao(endereco) {
    const resposta = await (await fetch(endereco)).json();
    return resposta.value;
  }

  async function resposta() {
    const url = "https://api.chucknorris.io/jokes/random";
    const resultadoEn = await requisicao(url);
    var resultadoPt = "";

    await translate(resultadoEn, { to: "pt" })
      .then(async (res) => {
        resultadoPt = await res;
      })
      .catch(async (err) => {
        resultadoPt = await "Deixa de ser doido";
      });

    await bot.telegram.sendMessage(
      ctx.chat.id,
      {
        text: resultadoPt + "\n\n -- " + resultadoEn + "",
      },
      {
        reply_to_message_id: ctx.message.message_id,
      }
    );
  }
  resposta();
});

bot.hears("Burro", (ctx) => {
  ctx.sendChatAction("typing");
  bot.telegram.sendPhoto(
    ctx.chat.id,
    {
      source: "./midia/burro.jpg",
    },
    {
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

// Gera a resposta com a api
const getChat = async (text) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      temperature: 0,
      max_tokens: 500,
    });

    return response.data.choices[0].text;
  } catch (error) {
    console.log(error);
  }
};

//comando que faz a pergunta
bot.command("responda", async (ctx) => {
  const text = ctx.message.text?.replace("/responda", "")?.trim().toLowerCase();

  if (text) {
    ctx.sendChatAction("typing");

    const res = await getChat(text);
    if (res) {
      if (ctx.message.message_id) {
        ctx.telegram.sendMessage(ctx.message.chat.id, `${res}`, {
          reply_to_message_id: ctx.message.message_id,
        });
      } else {
        ctx.sendMessage(`${res}`);
      }
    }
  } else {
    if (ctx.message.message_id) {
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        "Por favor, use /responda para perguntar",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
    } else {
      ctx.sendMessage("Por favor, use /responda para perguntar");
    }
  }
});

bot.launch();

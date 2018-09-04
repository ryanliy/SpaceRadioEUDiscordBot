const { Client, RichEmbed } = require("discord.js");
const { TOKEN, PREFIX, STREAMS } = require("./config");

const client = new Client({ disableEveryone: true });

var servers = {};

function play(connection, msg) {
  servers[msg.guild.id].dispatcher = connection.playStream(
    servers[msg.guild.id].current.url
  );
  servers[msg.guild.id].dispatcher.on("end", function() {
    play(connection, msg);
  });
}

client.on("ready", () => console.log(`${client.user.username} is Online!`));
client.on("disconnect", () => console.log(`[DISCONNECT]`));
client.on("reconnecting", () => console.log(`[RECONNECTING]`));
client.on("error", () => console.error);
client.on("warn", () => console.warn);

client.on("message", msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;
  const args = msg.content
    .slice(PREFIX.length)
    .trim()
    .split(/ +/g);

  if (msg.content.startsWith(`${PREFIX}play`)) {
    args.shift();

    if (!servers[msg.guild.id]) {
      servers[msg.guild.id] = {
        voiceChannel: null,
        current: {},
        joinedChannel: null
      };
    }

    servers[msg.guild.id].voiceChannel = msg.member.voiceChannel;

    if (servers[msg.guild.id].joinedChannel) {
      if (
        servers[msg.guild.id].voiceChannel !==
        servers[msg.guild.id].joinedChannel
      ) {
        return;
      }
    }

    if (!servers[msg.guild.id].voiceChannel) {
      return msg.reply(
        "Sorry but you need to be in a voice channel to play music."
      );
    }

    const permissions = servers[msg.guild.id].voiceChannel.permissionsFor(
      msg.client.user
    );
    if (!permissions.has("CONNECT")) {
      return msg.reply(
        "I cannot connect to your voice channel, make sure I have the propper premissions."
      );
    }

    if (!permissions.has("SPEAK")) {
      return msg.reply(
        "I cannot speak in this voice channel, make sure I have the propper permissions."
      );
    }
    console.log("7");
    if (args.join(" ") === "") {
      const embed = new RichEmbed().setColor(0x1d82b6);
      let streamFound = 0;
      STREAMS.forEach(element => {
        streamFound++;
        embed.addField(`${element.name}`, `**ID:** ${element.id}`);
      });

      embed.setFooter("You can use the ID and the name.");
      return msg.reply(embed);
    }

    if (!msg.guild.voiceConnection) {
      servers[msg.guild.id].joinedChannel = msg.member.voiceChannel;
      servers[msg.guild.id].voiceChannel
        .join()
        .then(async function(connection) {
          await STREAMS.forEach(element => {
            if (
              args.join(" ").toLocaleLowerCase() == element.id ||
              args.join(" ").toLocaleLowerCase() ==
                element.name.toLocaleLowerCase()
            ) {
              servers[msg.guild.id].current = element;
              play(connection, msg);
              const embed = new RichEmbed().setColor(0x1d82b6);
              embed.addField(
                `Stream has set to.`,
                `**Stream:** ${servers[msg.guild.id].current.name}`
              );
              return msg.channel.send(embed);
            }
          });
        });
    }

    if (servers[msg.guild.id].dispatcher) {
      STREAMS.forEach(element => {
        if (
          args.join(" ").toLocaleLowerCase() == element.id ||
          args.join(" ").toLocaleLowerCase() == element.name.toLocaleLowerCase()
        ) {
          servers[msg.guild.id].current = element;

          const embed = new RichEmbed().setColor(0x1d82b6);
          embed.addField(
            `Stream has set to.`,
            `**Stream:** ${servers[msg.guild.id].current.name}`
          );
          return msg.channel.send(embed);
        }
        servers[msg.guild.id].dispatcher.end();
      });
    }
  }
  if (msg.content.startsWith(`${PREFIX}stop`)) {
    args.shift();
    if (!msg.member.voiceChannel) {
      return msg.reply("You are not in a voice channel.");
    }
    msg.guild.voiceConnection.disconnect();
    return;
  }
});

client.login(TOKEN);

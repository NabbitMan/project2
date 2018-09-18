FROM node:8

ADD . /app
WORKDIR /app
RUN apt-get update
RUN useradd -d /home/term -m -s /bin/bash term
RUN echo 'term:term' | chpasswd
RUN npm install
RUN npm install -g grunt-cli
RUN grunt
RUN npm install -g express-generator
RUN express --view=ejs /home/term/tutorial2
RUN chown -R term:term /home/term/tutorial2

EXPOSE 3000

ENTRYPOINT ["node"]
CMD ["app.js", "-p", "3000", "-d", "/home/term/tutorial2"]

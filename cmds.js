const readline = require('readline');

const {models} = require('./model');
const {log,biglog,errorlog, colorize} = require('./out');

const Sequelize = require('sequelize');


/*
 *Muestra el comando de ayuda por pantalla.
 */
exports.helpCmd = rl => {
  log('Comandos:');
  log('   h|help - Muestra esta ayuda.');
  log('   show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
  log('   add - Añadir un nuevo quiz interactivamente.');
  log('   delete <id> - Borrar el quiz indicado.');
  log('   edit <id> - Editar el quiz indicado.');
  log('   test <id> - Probar el quiz indicado.');
  log('   p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
  log('   credits - Créditos.');
  log('   q|quit - Quitar el programa.');
  rl.prompt();
}

/*
 *Termina el programa.
 */
exports.quitCmd = rl => {
  rl.close();
  rl.prompt();
}

/*
 *Anade una nueva pregunta
 */

const makeQuestion =(rl, text) => {
  return new Sequelize.Promise ((resolve, reject) => {
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });
};



exports.addCmd = rl => {

  makeQuestion(rl, ' Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, ' Introduzca la respuesta: ')
    .then(a => {
      return {question: q, answer:a};
    });
  })
.then(quiz=>{
    return models.quiz.create(quiz);
})
.then((quiz) => {
    log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize(' => ','magenta')} ${quiz.answer}`);
})
.catch(Sequelize.ValidationError, error => {
  errorlog ('El quiz es erroneo:');
  error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
  errorlog(error.message);
})
.then(() => {
  rl.prompt();
});
/*
  rl.question(colorize(' Introduzca una pregunta: ', 'red'), question =>{
    rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer =>{
      model.add(question, answer);
      log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize(' => ','magenta')} ${answer}`);
      rl.prompt();
    })
  })
  */
};

/*
 *Saca todos los quizzes existentes
 */
exports.listCmd = rl => {

  models.quiz.findAll()
  .each(quiz => {
      log(`[${colorize(quiz.id, 'magenta')}]:  ¿${quiz.question}?`);
    })
  .catch(error =>{
    errorlog(error.message);
  })
  .then(()=>{
    rl.prompt();
  })
}

//Devuelve una promesa si el id es valido
const validateId = id =>{

  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined"){
      reject(new Error(`Falta el parametro <id>.`));
    }else{
      id=parseInt(id);
      if(Number.isNaN(id)){
        reject(new Error(`El valor del parametro <id> no es un numero.`));
      }else{
        resolve(id);
      }
    }
  })
}
/*
 *Muestra el quiz que se indica
 */
exports.showCmd = (rl,id) => {
/*
  if (typeof id === "undefined"){
    errorlog('Falta el parámetro id.');
  }else{
    try{
      const quiz = model.getByIndex(id);
      log(`  [${colorize(id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    }catch(error){
      errorlog(error.message);
    }
  }
  */
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error (` No existe un quiz asociado al id=${id}.`);
    }
    log(`  [${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

/*
 *Prueba el quiz que se indica
 */
exports.testCmd = (rl,id) => {
  log('Probar el quiz indicado.','red');
  rl.prompt();
};

/*

  if (typeof id === "undefined"){
    errorlog('Falta el parámetro id.');
    rl.prompt();
  }else{
    try{
      const quiz = model.getByIndex(id);
      rl.question(colorize(` ${quiz.question}: `, 'magenta'), answer =>{
        if (quiz.answer.toLowerCase().trim()===answer.toLowerCase().trim()){
          log('Su respuesta es correcta');
          biglog('Correcta', 'green');
        }else{
          log('Su respuesta es incorrecta');
          biglog('Incorrecta', 'red');
        }
        rl.prompt();
      })
    }catch(error){
      errorlog(error.message);
      rl.prompt();
    }
  }


}
*/
/*
 *Empieza el juego
 */
exports.playCmd = rl => {

  log('Jugar.','red');
  rl.prompt();
};


/*
  let score= 0;

  let toBeResolved = [];
  for (i=0; i<model.count();i++){
    toBeResolved[i]=i;
  }

  const play = () => {
    if (toBeResolved.length===0){
      log('¡No hay preguntas que responder!','yellow');
      log('Fin del examen. Aciertos: ');
      biglog(score,'blue');
    }else{

      let id= Math.floor(Math.random() * toBeResolved.length);

      let quiz = model.getByIndex(toBeResolved[id]);

      toBeResolved.splice(id,1);
      rl.question(colorize(`¿${quiz.question}? `, 'magenta'),answer =>{
        if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
          score++;
          log(` CORRECTO - Lleva ${score} aciertos`);
          play();
        }else{
          log(' INCORRECTO.');
          log(` Fin del juego. Aciertos: ${score} `);
          biglog(score, 'blue');
          rl.prompt();
        }
      })
    }
    rl.prompt();
  }
  play();
}
*/
/*
 *Borra el quiz indicado
 */
exports.deleteCmd = (rl,id) => {
validateId(id)
.then(id => models.quiz.destroy({where: {id}}))
.catch(error => {
  errorlog(error.message);
})
.then(() => {
  rl.prompt();
});
};



/*  if(typeof id === "undefined"){
    errorlog(`Falta el parámetro id.`);
  }else{
    try{
      model.deleteByIndex(id);
    }catch(error){
      errorlog(error.message);
    }
  }
  rl.prompt();
}*/

/*
 *Edita el quiz indicado
 */
exports.editCmd = (rl,id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe el parametro asociado ${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
    .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
        return makeQuestion(rl, 'Introduzca la respuesta ')
        .then(a => {
          quiz.question =q;
          quiz.answer =a;
          return quiz;
        });
    });
  })
.then(quiz => {
  return quiz.save();
})
.then(quiz => {
  log (`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
})
.catch(Sequelize.ValidationError, error => {
  errorlog('El quiz es erroneo:');
  error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
  errorlog(error.message);
})
.then(() => {
  rl.prompt();
});
}


  /*if(typeof id === "undefined"){
    errorlog(`Falta el parámetro id.`);
    rl.prompt();
  }else{
    try{
      const quiz = model.getByIndex(id);

      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
      rl.question(colorize( ' Introduzca una pregunta: ', 'red'), question => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
          model.update(id,question, answer);
          log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por ${question} ${answer}`);
          rl.prompt();
        })
      })
    }catch(error){
      errorlog(error.message);
      rl.prompt();
    }
  }
  rl.prompt();*/


/*
 *Muestra los creditos
 */
exports.creditsCmd = rl => {
  log('Autores de la práctica:');
  log('Andres Jimenez', 'green');
  log('Javier Anton', 'green');
  rl.prompt();
}

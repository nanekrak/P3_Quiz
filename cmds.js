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
    rl.question(colorize(` ¿${text}? `, 'red'), answer => {
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

  		let score = 0; //acumulov el resultado
  		let toBePlayed = []; //array a rellenar con todas las preguntas de la BBDD. Como se consigue? Con una promesa

      for (i=0; i<models.quiz.count();i++){
        toBeResolved[i]=i;
      }

  		const playOne = () => {
        return new Sequelize.Promise ((resolve, reject) => {
  				if(toBePlayed.length === 0) {
            log(' ¡No hay preguntas que responder!','yellow');
            log(' Fin del examen. Aciertos: ');
  					resolve();
  					return;
  				}
  				let pos = Math.floor(Math.random()*toBePlayed.length);
  				let quiz = toBePlayed[pos];
  		    toBePlayed.splice(pos, 1); //lo borro porque ya no lo quiero más

  		    makeQuestion(rl, quiz.question)
  		    .then(answer => {
            if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
              score++;
  				    log(`  CORRECTO - Lleva ${score} aciertos`);
  				    resolve(playOne());
            }else{
              log('  INCORRECTO ');
              log(`  Fin del juego. Aciertos: ${score} `);
  				    resolve();
  			    }
  		    })
  	     })
  	  }
  		models.quiz.findAll({raw: true}) //el raw hace que enseñe un string solamente en lugar de todo el contenido
  		.then(quizzes => {
  			toBePlayed= quizzes;
      })
  		.then(() => {
  		 	return playOne(); //es necesario esperar a que la promesa acabe, por eso no es un return a secas
  		 })
  		.catch(e => {
  			errorlog("Error:" + e); //usar errorlog con colores
  		})
  		.then(() => {
  			biglog(score, 'blue');
  			rl.prompt();
  		})
}

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

/*
 *Muestra los creditos
 */
exports.creditsCmd = rl => {
  log('Autores de la práctica:');
  log('Andres Jimenez', 'green');
  log('Javier Anton', 'green');
  rl.prompt();
}

const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = findUser(username);

  if (!user) {
    return response.status(404).json({
      error: 'User not exists.'
    });
  }

  request.user = user;

  return next();
}

function findUser(username) {
  return users.find(user => user.username === username);
}

function findTodo(id, user) {
  return user.todos.find(todo => todo.id === id);
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if(findUser(username)) {
    return response.status(400).json({error: 'User already exists.'})
  }
  
  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { title, deadline } = request.body;

  const todo = { 
    id: uuidv4(),
    title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  const { title, deadline } = request.body;

  let todoUpdate = findTodo(id, user);

  if(!todoUpdate) {
    return response.status(404).json({error: 'Todo not exists.'});
  }

  todoUpdate = {
    ...todoUpdate,
    title,
    deadline,
  };

  user.todos = user.todos.map(todo => {
    if (todo.id === id) {
      return todoUpdate;
    }

    return todo;
  });

  return response.status(200).send(todoUpdate);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  let todoUpdate = findTodo(id, user);

  if(!todoUpdate) {
    return response.status(404).json({error: 'Todo not exists.'});
  }

  todoUpdate = {
    ...todoUpdate,
    done: true,
  };

  user.todos = user.todos.map(todo => {
    if (todo.id === id) {
      return todoUpdate;
    }

    return todo;
  });

  return response.status(200).send(todoUpdate);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  if (!findTodo(id, user)) {
    return response.status(404).json({error: 'Todo not exists.'});
  }

  user.todos = user.todos.filter(todo => todo.id !== id);

  return response.status(204).send();
});

module.exports = app;

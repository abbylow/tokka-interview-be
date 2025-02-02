export class Queue {
  add = jest.fn(); // Mock the add method of BullMQ Queue
}

export class Worker {
  constructor() {
    console.log('Mocked Worker initialized');
  }

  on = jest.fn(); // Mock the on method of BullMQ Worker
  close = jest.fn(); // Mock the close method
}

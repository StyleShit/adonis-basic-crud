import Post from 'App/Models/Post'
import Factory from '@ioc:Adonis/Lucid/Factory'

export default Factory.define(Post, ({ faker }) => {
  return {
    title: faker.random.words(5),
    content: faker.random.words(50),
  }
}).build()

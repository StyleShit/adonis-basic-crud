import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import Post from 'App/Models/Post'
import { PostFactory } from 'Database/factories'
import { faker } from '@faker-js/faker'

test.group('PostsController', (group) => {
  // Clean database between tests.
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    return () => Database.rollbackGlobalTransaction()
  })

  test('Should show all posts', async ({ client }) => {
    // Arrange.
    await PostFactory.createMany(5)

    // Act.
    const response = await client.get('/api/v1/posts')

    // Assert.
    const expectedBody = (await Post.all()).map((post) => post.toJSON())

    response.assertStatus(200)
    response.assertBody(expectedBody)
  })

  test('Should fail to create post with invalid post data -- {name}')
    .with(postCreationDataProvider)
    .run(async ({ client }, { postData, errors }) => {
      // Act.
      const response = await client.post('/api/v1/posts').json(postData)

      // Assert.
      response.assertStatus(422)
      response.assertBodyContains({ errors })
    })

  test('Should create a new post', async ({ client }) => {
    // Arrange.
    const postData = {
      title: 'test-title',
      content: 'test-content',
    }

    // Act.
    const response = await client.post('/api/v1/posts').json(postData)

    // Assert.
    const createdPost = await Post.find(response.body().id)

    response.assertStatus(201)
    response.assertBodyContains({
      title: createdPost?.title,
      content: createdPost?.content,
    })
  })

  test('Should throw 404 for non-existing post when trying to view it', async ({ client }) => {
    // Act.
    const response = await client.get('/api/v1/posts/non-existing-id')

    // Assert.
    response.assertStatus(404)
    response.assertBody({
      errors: [{
        message: 'Post not found',
      }],
    })
  })

  test('Should return a post when trying to view it', async ({ client }) => {
    // Arrange.
    const post = await PostFactory.create()

    // Act.
    const response = await client.get(`/api/v1/posts/${ post.id }`)

    // Assert.
    response.assertStatus(200)
    response.assertBodyContains({
      title: post.title,
      content: post.content,
    })
  })

  test('Should fail to update post with invalid post data -- {name}')
    .with(postUpdateDataProvider)
    .run(async ({ client }, { postData, errors }) => {
      // Arrange.
      const post = await PostFactory.create()

      // Act.
      const response = await client.patch(`/api/v1/posts/${ post.id }`).json(postData)

      // Assert.
      response.assertStatus(422)
      response.assertBodyContains({ errors })
    })

  test('Should throw 404 for non-existing post when trying to update it', async ({ client }) => {
    // Arrange.
    const postData = {
      title: 'new-title',
    }

    // Act.
    const response = await client.patch('/api/v1/posts/non-existing-id').json(postData)

    // Assert.
    response.assertStatus(404)
    response.assertBody({
      errors: [{
        message: 'Post not found',
      }],
    })
  })

  test('Should update a post', async ({ client, assert }) => {
    // Arrange.
    const post = await PostFactory.create()

    const postData = {
      title: 'new-title',
      content: 'new-content',
    }

    // Act.
    const response = await client.patch(`/api/v1/posts/${ post.id }`).json(postData)

    // Assert.
    const updatedPost = await Post.find(post.id)

    response.assertStatus(200)
    response.assertBodyContains({
      title: 'new-title',
      content: 'new-content',
    })

    assert.equal('new-title', updatedPost?.title)
    assert.equal('new-content', updatedPost?.content)
  })

  test('Should throw 404 for non-existing post when trying to delete it', async ({ client }) => {
    // Act.
    const response = await client.delete('/api/v1/posts/non-existing-id')

    // Assert.
    response.assertStatus(404)
    response.assertBody({
      errors: [{
        message: 'Post not found',
      }],
    })
  })

  test('Should delete a post', async ({ client, assert }) => {
    // Arrange.
    const post = await PostFactory.create()

    // Act.
    const response = await client.delete(`/api/v1/posts/${ post.id }`)

    // Assert.
    const deletedPost = await Post.find(post.id)

    response.assertStatus(200)
    response.assertBodyContains({
      id: post.id,
    })

    assert.notExists(deletedPost)
  })
})

function postCreationDataProvider () {
  return [
    {
      name: 'Missing params',
      postData: {},
      errors: [
        {
          field: 'title',
          rule: 'required',
        },
        {
          field: 'content',
          rule: 'required',
        },
      ],
    },
    {
      name: 'Invalid types',
      postData:  {
        title: 1,
        content: 2,
      },
      errors: [
        {
          field: 'title',
          rule: 'string',
        },
        {
          field: 'content',
          rule: 'string',
        },
      ],
    },
    {
      name: 'Invalid lengths',
      postData: {
        title: faker.random.words(101),
        content: faker.random.words(501),
      },
      errors: [
        {
          args: {
            maxLength: 100,
          },
          field: 'title',
          rule: 'maxLength',
        },
        {
          args: {
            maxLength: 500,
          },
          field: 'content',
          rule: 'maxLength',
        },
      ],
    },
  ]
}

function postUpdateDataProvider () {
  return [
    {
      name: 'Invalid types',
      postData:  {
        title: 1,
        content: 2,
      },
      errors: [
        {
          field: 'title',
          rule: 'string',
        },
        {
          field: 'content',
          rule: 'string',
        },
      ],
    },
    {
      name: 'Invalid lengths',
      postData: {
        title: faker.random.words(101),
        content: faker.random.words(501),
      },
      errors: [
        {
          args: {
            maxLength: 100,
          },
          field: 'title',
          rule: 'maxLength',
        },
        {
          args: {
            maxLength: 500,
          },
          field: 'content',
          rule: 'maxLength',
        },
      ],
    },
  ]
}

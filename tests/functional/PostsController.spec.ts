import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import Post from 'App/Models/Post'
import { PostFactory, UserFactory } from 'Database/factories'
import { faker } from '@faker-js/faker'
import AuthManager from '@ioc:Adonis/Addons/Auth'

test.group('PostsController', (group) => {
  // Clean database between tests.
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()

    return () => Database.rollbackGlobalTransaction()
  })

  test('Should require authentication -- {name}')
    .with([
      {
        name: 'Create post',
        method: 'post',
        url: '/',
      },
      {
        name: 'Edit post',
        method: 'patch',
        url: '/1',
      },
      {
        name: 'Delete post',
        method: 'delete',
        url: '/1',
      },
    ])
    .run(async ({ client }, { method, url }) => {
      // Act.
      const response = await client[method](`/api/v1/posts${ url }`)

      // Assert.
      response.assertStatus(401)
    })

  /**
   * GET /posts
   */
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

  /**
   * POST /posts
   */
  test('Should fail to create post with invalid post data -- {name}')
    .with(postCreationDataProvider)
    .run(async ({ client }, { postData, errors }) => {
      // Arrange.
      const { headers } = await auth()

      // Act.
      const response = await client.post('/api/v1/posts')
        .headers(headers)
        .json(postData)

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

    const { headers } = await auth()

    // Act.
    const response = await client.post('/api/v1/posts')
      .headers(headers)
      .json(postData)

    // Assert.
    const createdPost = await Post.find(response.body().id)

    response.assertStatus(201)
    response.assertBodyContains({
      title: createdPost?.title,
      content: createdPost?.content,
    })
  })

  /**
   * GET /posts/:id
   */
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

  /**
   * PATCH /posts/:id
   */
  test('Should fail to update post with invalid post data -- {name}')
    .with(postUpdateDataProvider)
    .run(async ({ client }, { postData, errors }) => {
      // Arrange.
      const post = await PostFactory.create()

      const { headers } = await auth()

      // Act.
      const response = await client.patch(`/api/v1/posts/${ post.id }`)
        .headers(headers)
        .json(postData)

      // Assert.
      response.assertStatus(422)
      response.assertBodyContains({ errors })
    })

  test('Should throw 404 for non-existing post when trying to update it', async ({ client }) => {
    // Arrange.
    const postData = {
      title: 'new-title',
    }

    const { headers } = await auth()

    // Act.
    const response = await client.patch('/api/v1/posts/non-existing-id')
      .headers(headers)
      .json(postData)

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

    const { headers } = await auth()

    // Act.
    const response = await client.patch(`/api/v1/posts/${ post.id }`)
      .headers(headers)
      .json(postData)

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

  /**
   * DELETE /posts/:id
   */
  test('Should throw 404 for non-existing post when trying to delete it', async ({ client }) => {
    // Arrange.
    const { headers } = await auth()

    // Act.
    const response = await client.delete('/api/v1/posts/non-existing-id').headers(headers)

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
    const { headers } = await auth()

    // Act.
    const response = await client.delete(`/api/v1/posts/${ post.id }`).headers(headers)

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

async function auth () {
  const {
    cookies = {},
    headers = {},
    session = {},
  } = await AuthManager.client('api').login(await UserFactory.create())

  return {
    cookies,
    headers,
    session,
  }
}

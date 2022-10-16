import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import CreatePostValidator from 'App/Validators/CreatePostValidator'

export default class PostsController {
  public async index () {
    return await Post.all()
  }

  public async store ({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePostValidator)

    const post = await Post.create(payload)

    response.created(post)
  }

  public async show ({ request, response }: HttpContextContract) {
    const postId = request.param('id')

    const post = await Post.find(postId)

    if (! post) {
      return response.notFound({
        errors: [{
          message: 'Post not found',
        }],
      })
    }

    return post
  }

  public async update ({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePostValidator)

    const postId = request.param('id')

    const post = await Post.find(postId)

    if (! post) {
      return response.notFound({
        errors: [{
          message: 'Post not found',
        }],
      })
    }

    return post.merge(payload).save()
  }

  public async destroy ({request, response }: HttpContextContract) {
    const postId = request.param('id')

    const post = await Post.find(postId)

    if (! post) {
      return response.notFound({
        errors: [{
          message: 'Post not found',
        }],
      })
    }

    await post.delete()

    return post
  }
}

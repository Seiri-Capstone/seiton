import prisma from '../../../prisma/prisma'

export default async function putTask(req, res) {
  try {
    console.log("we're in the put task request!", req.body)
    const { id, title, projectId, index } = req.body
    // const result = await prisma.task.update({
    //   where: { id: id },
    //   data: {
    //     title,
    //     projectId,
    //     index
    //   }
    // })

    res.status(200).json('meow')
  } catch (error) {
    console.log('error in the column api call!', error)
  }
}
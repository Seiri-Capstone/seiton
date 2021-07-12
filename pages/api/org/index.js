/* eslint-disable import/no-anonymous-default-export */
import prisma from '../../../prisma/prisma'
import { getSession } from 'next-auth/client'

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    res.status(403).json({
      message: 'You must be signed in to view this page.'
    })
  } else {
    // 📡 GET /api/org/
    if (req.method === 'GET') {
      try {
        //get user by session and eager load org info
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            orgs: {
              include: {
                org: true
              }
            }
          }
        })

        const orgs = user.orgs.map(org => {
          return org.org
        })

        //get organizations that user is associated with
        // const result = await prisma.userOrg.findMany({
        //   where: { userId: user.id },
        //   include: {
        //     org: true
        //   }
        // })

        res.status(200).json(orgs)
      } catch (error) {
        console.error(error) // Which one is idiomatic?
        throw new Error('Error getting org!')
      }
    }

    // 📡 POST /api/org/
    if (req.method === 'POST') {
      try {
        // const { org } = req.body
        const org = { name: 'MEOW' }

        // console.log('org', org)

        const newOrg = await prisma.org.create({ data: org })

        // const user = await prisma.user.update({
        //   where: { email: session.user.email },
        //   data: {
        //     orgs: {
        //       create: {
        //         org: {
        //           create: org
        //         }
        //       }
        //     }
        //   }
        // })

        const user = await prisma.user.update({
          where: { email: session.user.email },
          data: {
            orgs: {
              connect: { id: newOrg.id, name: newOrg.name }
            }
          }
        })

        // const result = await prisma.userOrg.findUnique({
        //   where: { userId: user.id, orgId: newOrg.id },
        //   include: {
        //     org: true
        //   }
        // })

        console.log(user.orgs)

        res.status(200).json(newOrg)
      } catch (error) {
        console.log('error in org post request', error)
      }
    }
  }
}

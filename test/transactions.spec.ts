import { afterAll, beforeAll, describe, it, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'

describe('Transactions Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('Should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('Should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 7000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    const listTransactionsResponse = request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect((await listTransactionsResponse).body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 7000,
      }),
    ])
  })

  it('Should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 7000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    const listTransactionsResponse = request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = (await listTransactionsResponse).body.transactions[0].id

    const getTransactionsResponse = request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)


    expect((await getTransactionsResponse).body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 7000,
      }),
    )
  })
  

  it('Should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 7000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResponse = request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect((await summaryResponse).body.summary).toEqual({
        amount: 5000
    })
  })
})
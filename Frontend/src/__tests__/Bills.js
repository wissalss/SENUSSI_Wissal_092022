/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
jest.mock("../app/Store", () => mockStore)



describe("Given I am connected as an employee", () => {
        describe("When I am on Bills Page", () => {
            test("Then bill icon in vertical layout should be highlighted", async() => {

                Object.defineProperty(window, 'localStorage', { value: localStorageMock })
                window.localStorage.setItem('user', JSON.stringify({
                    type: 'Employee'
                }))
                const root = document.createElement("div")
                root.setAttribute("id", "root")
                document.body.append(root)
                router()
                window.onNavigate(ROUTES_PATH.Bills)
                await waitFor(() => screen.getByTestId('icon-window'))
                const windowIcon = screen.getByTestId('icon-window')
                    //to-do write expect expression
                expect(Array.from(windowIcon.classList).includes('active-icon')).toBe(true);

            })
            test("Then bills should be ordered from earliest to latest", () => {
                document.body.innerHTML = BillsUI({ data: bills })
                const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
                const antiChrono = (a, b) => ((a < b) ? 1 : -1)
                const datesSorted = [...dates].sort(antiChrono)
                expect(dates).toEqual(datesSorted)
            })
        })
    })
    //         Test Eye Icon   //
describe("When I am on Bills Page and i click on the eye icon", () => {
    test("the receipt that has been uploaded appears", () => {
        const BillsHtml = BillsUI({ data: bills })
        $.fn.modal = jest.fn()
        document.body.innerHTML = BillsHtml
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
        const store = null
        const billsView = new Bills({
            document,
            onNavigate,
            store,
            localStorage: window.localStorage,
        })
        const iconeEye = screen.getAllByTestId('icon-eye')[0]
        const clickIconeEye = jest.fn(billsView.handleClickIconEye)
        iconeEye.addEventListener('click', clickIconeEye(iconeEye))
        fireEvent.click(iconeEye)
        expect(screen.getByText("Justificatif")).toBeTruthy()
    })
})

//       Test New Note de Frais     //

describe("When i click Nouvelle note de frais", () => {
    test("new bill appears", () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
        const billsPage = new Bills({
            document,
            onNavigate,
            store: null,
            bills: bills,
            localStorage: window.localStorage
        })

        const OpenNewBill = jest.fn(billsPage.handleClickNewBill);
        const btnNewBill = screen.getByTestId("btn-new-bill")
        btnNewBill.addEventListener("click", OpenNewBill)
        fireEvent.click(btnNewBill)
        expect(OpenNewBill).toHaveBeenCalled()
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
})

//           test d'integrations    Get     //

describe("When an error occurs on API", () => {
    beforeEach(() => {
        jest.spyOn(mockStore, 'bills')
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
        })
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Employee',
                email: 'a@a',
            })
        )
        const root = document.createElement('div')
        root.setAttribute('id', 'root')
        document.body.appendChild(root)
        router()
    })

    test("fetches bills from an API and fails with 404 message error", async() => {
        mockStore.bills.mockImplementationOnce(() => {
            return {
                list: () => {
                    return Promise.reject(new Error("Erreur 404"))
                }
            }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async() => {
        mockStore.bills.mockImplementationOnce(() => {
            return {
                list: () => {
                    return Promise.reject(new Error("Erreur 500"))
                }
            }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
    })
})
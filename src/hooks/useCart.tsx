import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    console.log(cart)
  },[cart])

  const addProduct = async (productId: number) => {
    try {
      const alreadyExists = cart.findIndex(item => item.id === productId);

      const responseStock = await api.get(`/stock/${productId}`);

      let newCart = [...cart];

      if(alreadyExists !== -1){
        if(responseStock.data.amount <  newCart[alreadyExists].amount + 1){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
         newCart[alreadyExists].amount += 1; 
      }else{
        const responseProduct = await api.get(`/products/${productId}`);
        newCart.push({...responseProduct.data, amount: 1})
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(item => item.id === productId);

      if(!productExists){
        toast.error('Erro na remoção do produto');
        return;
      }

      const newCart = cart.filter(item => item.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }
      const alreadyExists = cart.findIndex(item => item.id === productId);
      const responseStock = await api.get(`/stock/${productId}`);
      let newCart = [...cart];

      if(alreadyExists !== -1){
        if(responseStock.data.amount <  newCart[alreadyExists].amount + 1){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        newCart[alreadyExists].amount = amount; 
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import { surroundingAgent } from '../engine.mjs';
import {
  Call,
  Construct,
  CreateArrayFromList,
  CreateBuiltinFunction,
  CreateListFromArrayLike,
  FromPropertyDescriptor,
  IsCallable,
  IsConstructor,
  ObjectCreate,
  PrepareForTailCall,
  SetFunctionLength,
  SetFunctionName,
  ToPropertyDescriptor,
  ToPropertyKey,
} from '../abstract-ops/all.mjs';
import { New as NewValue, Type } from '../value.mjs';
import { Q } from '../completion.mjs';

function Reflect_apply(realm, [target, thisArgument, argumentsList]) {
  if (IsCallable(target).isFalse()) {
    return surroundingAgent.Throw('TypeError', 'target is not callable');
  }
  const args = Q(CreateListFromArrayLike(argumentsList));
  PrepareForTailCall();
  return Q(Call(target, thisArgument, args));
}

function Reflect_construct(realm, [target, argumentsList, newTarget]) {
  if (IsConstructor(target).isFalse()) {
    return surroundingAgent.Throw('TypeError', 'target is not a constructor');
  }
  if (!newTarget) {
    newTarget = target;
  } else if (IsConstructor(newTarget).isFalse()) {
    return surroundingAgent.Throw('TypeError', 'newTarget is not a constructor');
  }
  const args = Q(CreateListFromArrayLike(argumentsList));
  return Q(Construct(target, args, newTarget));
}

function Reflect_defineProperty(realm, [target, propertyKey, attributes]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const key = Q(ToPropertyKey(propertyKey));
  const desc = Q(ToPropertyDescriptor(attributes));
  return Q(target.DefineOwnProperty(key, desc));
}

function Reflect_deleteProperty(realm, [target, propertyKey]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const key = Q(ToPropertyKey(propertyKey));
  return Q(target.Delete(key));
}

function Reflect_get(realm, [target, propertyKey, receiver]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const key = Q(ToPropertyKey(propertyKey));
  if (!receiver) {
    receiver = target;
  }
  return Q(target.Get(key, receiver));
}

function Reflect_getOwnPropertyDescriptor(realm, [target, propertyKey]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const key = Q(ToPropertyKey(propertyKey));
  const desc = Q(target.GetOwnProperty(key));
  return FromPropertyDescriptor(desc);
}

function Reflect_getPrototypeOf(realm, [target]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  return Q(target.GetPrototypeOf());
}

function Reflect_has(realm, [target, propertyKey]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const key = Q(ToPropertyKey(propertyKey));
  return Q(target.HasProperty(key));
}

function Reflect_isExtensible(realm, [target]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  return Q(target.IsExtensible());
}

function Reflect_ownKeys(realm, [target]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const keys = Q(target.OwnPropertyKeys());
  return CreateArrayFromList(keys);
}

function Reflect_preventExtensions(realm, [target]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  return Q(target.PreventExtensions());
}

function Reflect_set(realm, [target, propertyKey, V, receiver]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  const key = Q(ToPropertyKey(propertyKey));
  if (!receiver) {
    receiver = target;
  }
  return Q(target.Set(key, V, receiver));
}

function Reflect_setPrototypeOf(realm, [target, proto]) {
  if (Type(target) !== 'Object') {
    return surroundingAgent.Throw('TypeError', 'target is not an object');
  }
  if (Type(proto) !== 'Object' || Type(proto) !== 'Null') {
    return surroundingAgent.Throw('TypeError', 'proto is not an object or null');
  }
  return Q(target.SetPrototypeOf(proto));
}

export function CreateReflect(realmRec) {
  const reflect = ObjectCreate(realmRec.Intrinsics['%ObjectPrototype%']);

  [
    ['apply', Reflect_apply, 3],
    ['construct', Reflect_construct, 2],
    ['defineProperty', Reflect_defineProperty, 3],
    ['deleteProperty', Reflect_deleteProperty, 2],
    ['get', Reflect_get, 2],
    ['getOwnPropertyDescriptor', Reflect_getOwnPropertyDescriptor, 2],
    ['getPrototypeOf', Reflect_getPrototypeOf, 1],
    ['has', Reflect_has, 2],
    ['isExtensible', Reflect_isExtensible, 1],
    ['ownKeys', Reflect_ownKeys, 1],
    ['preventExtensions', Reflect_preventExtensions, 1],
    ['set', Reflect_set, 3],
    ['setPrototypeOf', Reflect_setPrototypeOf, 2],
  ].forEach(([name, fn, len]) => {
    fn = CreateBuiltinFunction(fn, [], realmRec);
    SetFunctionName(fn, NewValue(name));
    SetFunctionLength(fn, NewValue(len));
    reflect.DefineOwnProperty(NewValue(name), {
      Value: fn,
      Writable: true,
      Enumerable: false,
      Configurable: true,
    });
  });

  realmRec.Intrinsics['%Reflect%'] = reflect;
}
